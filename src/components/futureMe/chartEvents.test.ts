import { initialAge60 } from './age60Answers';
import { Age65Answers, initialAge65 } from './age65Answers';
import { Age66Answers, initialAge66 } from './age66Answers';
import { initialExpenses, withLevel } from './expensesAnswers';
import { initialSpecialPension } from './specialPensionAnswers';
import { chartEventsOf } from './chartEvents';
import { resultOf, ResultContext } from './resultAnswers';
import { initialAnswers, toStepPlanInput, YouAnswers } from './youAnswers';

const contextWith = (
  age65: Partial<Age65Answers> = {},
  age66: Partial<Age66Answers> = {},
  gross = '2000',
  changes: Partial<YouAnswers> = {},
  expenses = initialExpenses(),
): ResultContext => {
  const you = {
    ...initialAnswers({ birthYear: 1976, sex: null, secondPillarRate: null }),
    pensionAgeYears: '65',
    firstPillarMonthly: '700',
    grossMonthly: gross,
    secondPillarAmount: '10000',
    secondPillarReturnPercent: 2,
    thirdPillarReturnPercent: 2,
    ...changes,
  };
  return {
    you,
    plan: toStepPlanInput(you),
    age60: initialAge60(),
    age65: { ...initialAge65(), ...age65 },
    age66: { ...initialAge66(), ...age66 },
    specialPension: initialSpecialPension(),
    expenses,
  };
};

const kindsOf = (context: ResultContext) =>
  chartEventsOf(resultOf(context)).map(({ kind }) => kind);

describe('chartEvents', () => {
  it('marks the fund pension start at 55 when the III pillar pays from then', () => {
    const context = contextWith({}, {}, '2000', {
      thirdPillarJoined: 'before',
      thirdPillarAmount: '8000',
      thirdPillarPlan: 'fund',
    });

    const fundStarts = chartEventsOf(resultOf(context)).filter(({ kind }) => kind === 'fundStart');

    expect(fundStarts.map(({ age }) => age)).toEqual([55]);
  });

  it('starts at the pension age and ends where the share of people alive of the same age drops to 10%', () => {
    const result = resultOf(contextWith());

    const events = chartEventsOf(result);

    expect(events[0]).toMatchObject({ kind: 'pension', age: result.pensionStartAge });
    expect(events[events.length - 1]).toMatchObject({ kind: 'horizon', age: result.horizonAge });
  });

  it('lists the events by age', () => {
    const ages = chartEventsOf(
      resultOf(contextWith({ work: 'yes', workUntil: '68', secondPillar: 'fund' })),
    ).map(({ age }) => age);

    expect(ages).toEqual([...ages].sort((a, b) => a - b));
  });

  it('marks the end of work when the person works past the pension age', () => {
    const events = chartEventsOf(resultOf(contextWith({ work: 'yes', workUntil: '68' })));

    expect(events.find(({ kind }) => kind === 'workEnd')).toMatchObject({ age: 68 });
  });

  it('has no end of work for someone who retires at the pension age', () => {
    expect(kindsOf(contextWith())).not.toContain('workEnd');
  });

  it('marks when the fund pension starts', () => {
    expect(
      kindsOf(contextWith({ secondPillar: 'fund' }, { secondPillarContract: 'once' })),
    ).toContain('fundStart');
  });

  it('has no fund pension events for someone who does not take one', () => {
    const kinds = kindsOf(contextWith());

    expect(kinds).not.toContain('fundStart');
    expect(kinds).not.toContain('fundEnd');
  });

  describe('when the fund pension is one contract for the average remaining life', () => {
    const context = contextWith({ secondPillar: 'fund' }, { secondPillarContract: 'once' });
    const result = resultOf(context);
    const events = chartEventsOf(result);
    const fundStart = events.find(({ kind }) => kind === 'fundStart');
    const fundEnd = events.find(({ kind }) => kind === 'fundEnd');

    it('marks the end of the contract with the years it ran for', () => {
      expect(fundEnd).toBeDefined();
      expect(fundEnd?.age).toBeGreaterThan(fundStart?.age ?? Infinity);
      expect(fundEnd).toMatchObject({
        pillars: 'second',
        years: (fundEnd?.age ?? 0) - (fundStart?.age ?? 0),
      });
    });

    it('says what is left after it', () => {
      expect(['stateOnly', 'deposit']).toContain(fundEnd?.next);
    });
  });

  describe('fund pension contracts for the average remaining life', () => {
    const thirdPillar = {
      thirdPillarJoined: 'after' as const,
      thirdPillarAmount: '20000',
      thirdPillarMonthly: '0',
    };
    const fundEndsOf = (context: ResultContext) =>
      chartEventsOf(resultOf(context)).filter(({ kind }) => kind === 'fundEnd');

    it('marks the end of a second pillar contract when the state pension is deferred', () => {
      expect(
        fundEndsOf(
          contextWith(
            { secondPillar: 'fund', mode: 'defer', years: 2 },
            { secondPillarContract: 'once' },
          ),
        ),
      ).toEqual([{ kind: 'fundEnd', age: 84, pillars: 'second', years: 19, next: 'stateOnly' }]);
    });

    it('marks the end of a third pillar contract', () => {
      expect(
        fundEndsOf(
          contextWith(
            { thirdPillar: 'fund' },
            { thirdPillarContract: 'once' },
            '2000',
            thirdPillar,
          ),
        ),
      ).toEqual([{ kind: 'fundEnd', age: 84, pillars: 'third', years: 19, next: 'deposit' }]);
    });

    it('says the third pillar goes on when the second pillar contract ends and the third renews every year', () => {
      expect(
        fundEndsOf(
          contextWith(
            { secondPillar: 'fund', thirdPillar: 'fund' },
            { secondPillarContract: 'once', thirdPillarContract: 'yearly' },
            '2000',
            thirdPillar,
          ),
        ),
      ).toEqual([
        { kind: 'fundEnd', age: 84, pillars: 'second', years: 19, next: 'thirdContinues' },
      ]);
    });

    it('marks one end for second and third pillar contracts that start and end together', () => {
      expect(
        fundEndsOf(
          contextWith(
            { secondPillar: 'fund', thirdPillar: 'fund' },
            { secondPillarContract: 'once', thirdPillarContract: 'once' },
            '2000',
            thirdPillar,
          ),
        ),
      ).toEqual([{ kind: 'fundEnd', age: 84, pillars: 'both', years: 19, next: 'deposit' }]);
    });

    it('counts the years of each contract from its own start', () => {
      expect(
        fundEndsOf(
          contextWith(
            { secondPillar: 'fund', thirdPillar: 'grow' },
            { secondPillarContract: 'once', thirdPillarContract: 'once', thirdPillarFrom: '75' },
            '2000',
            thirdPillar,
          ),
        ),
      ).toEqual([
        { kind: 'fundEnd', age: 84, pillars: 'second', years: 19, next: 'thirdContinues' },
        { kind: 'fundEnd', age: 87, pillars: 'third', years: 12, next: 'deposit' },
      ]);
    });

    it('does not call a contract emptied early by extra withdrawals the end of its term', () => {
      const emptiedEarly = contextWith(
        { secondPillar: 'fund' },
        { secondPillarContract: 'once' },
        '2000',
        { firstPillarMonthly: '400' },
        withLevel(initialExpenses(), 'comfortable'),
      );

      expect(fundEndsOf(emptiedEarly)).toEqual([]);
      expect(kindsOf(emptiedEarly)).toContain('moneyEnd');
    });
  });

  it('does not end the fund pension that is signed again every year', () => {
    expect(
      kindsOf(contextWith({ secondPillar: 'fund' }, { secondPillarContract: 'yearly' })),
    ).not.toContain('fundEnd');
  });

  it('marks when the money runs out as a bad event', () => {
    const result = resultOf(contextWith({}, {}, '600'));

    const events = chartEventsOf(result);

    expect(events.find(({ kind }) => kind === 'moneyEnd')).toMatchObject({
      age: result.moneyEndAge,
      bad: true,
    });
  });

  it('has no end of money while the money lasts', () => {
    const result = resultOf(contextWith());

    expect(result.moneyEndAge).toBeNull();
    expect(kindsOf(contextWith())).not.toContain('moneyEnd');
  });

  it('marks a later start of the state pension when it is deferred', () => {
    const result = resultOf(contextWith({ mode: 'defer', years: 2 }));

    expect(chartEventsOf(result).find(({ kind }) => kind === 'statePension')).toMatchObject({
      age: result.p1StartAge,
    });
    expect(result.p1StartAge).toBeGreaterThan(result.pensionStartAge);
  });

  it('marks when the deposit starts to pay out', () => {
    const result = resultOf(contextWith({ work: 'yes', workUntil: '68' }));
    const firstDeposit = result.rows.find(
      ({ age, dep }) => age >= result.pensionStartAge && dep > 0.5,
    );

    expect(firstDeposit).toBeDefined();
    expect(chartEventsOf(result).find(({ kind }) => kind === 'depositStart')).toMatchObject({
      age: firstDeposit?.age,
    });
  });
});
