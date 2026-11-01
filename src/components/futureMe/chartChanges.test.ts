import { initialAge60 } from './age60Answers';
import { initialAge65 } from './age65Answers';
import { initialSpecialPension } from './specialPensionAnswers';
import { initialAge66 } from './age66Answers';
import { ChartChange, chartChangesOf } from './chartChanges';
import { chartRowsOf } from './chartData';
import { ChartEvent, chartEventsOf } from './chartEvents';
import { nominalFactorAt } from './nominal';
import { resultOf, ResultContext } from './resultAnswers';
import { contextWith } from './resultContextFixture';

const NEED = 791;

const changesOf = (context: ResultContext) => {
  const result = resultOf(context);
  return chartChangesOf(result, chartRowsOf(result, NEED), chartEventsOf(result));
};

const rescuer = (thirdPillarMonthly = '') =>
  contextWith({
    workAdded: true,
    hasRescue: true,
    rescueYears: '20',
    earlyYearsPicked: '5',
    thirdPillarJoined: 'after',
    thirdPillarAmount: '5000',
    thirdPillarMonthly,
  });

describe('chartChangesOf', () => {
  describe('for a rescuer', () => {
    const changes = changesOf(rescuer('500'));

    it('says the III pillar is taken out first because the pension does not cover the costs', () => {
      expect(changes).toContainEqual({ kind: 'withdrawalStart', age: 60, pillar: 'third' });
    });

    it('says the rescue allowance is followed by the old-age pension at the pension age', () => {
      expect(changes).toContainEqual({ kind: 'rescueAllowanceEnd', age: 65, pensionStarts: true });
    });

    it('says the state pension rises at the pension age because the tax-free income grows', () => {
      expect(changes).toContainEqual(
        expect.objectContaining({ kind: 'statePensionRise', age: 65, reason: 'allowance' }),
      );
    });

    it('lists the changes in the order of age', () => {
      const ages = changes.map(({ age }) => age);
      expect(ages).toEqual([...ages].sort((a, b) => a - b));
    });

    it('gives the rise in the prices of its year when the chart shows future prices', () => {
      const result = resultOf(rescuer('500'));
      const riseOf = (found: ChartChange[]) =>
        found.find((change) => change.kind === 'statePensionRise');
      const inFuturePrices = riseOf(
        chartChangesOf(result, chartRowsOf(result, NEED), chartEventsOf(result), true),
      );
      const inTodayPrices = riseOf(changes);
      const year = result.rows.find(({ age }) => age === 65)?.year ?? 0;

      expect(inFuturePrices).toEqual({
        ...inTodayPrices,
        amount:
          (inTodayPrices?.kind === 'statePensionRise' ? inTodayPrices.amount : 0) *
          nominalFactorAt(year),
      });
    });
  });

  it('lists the III pillar before the II pillar when both are first taken out at the same age, as the III pillar is taken first', () => {
    const context = contextWith({
      workAdded: true,
      hasRescue: true,
      rescueYears: '20',
      earlyYearsPicked: '5',
      thirdPillarJoined: 'after',
      thirdPillarAmount: '100',
    });

    expect(changesOf(context).filter(({ kind }) => kind === 'withdrawalStart')).toEqual([
      { kind: 'withdrawalStart', age: 60, pillar: 'third' },
      { kind: 'withdrawalStart', age: 60, pillar: 'second' },
    ]);
  });

  it('says when the state pension starts after the waiting allowance, when the saver deferred it', () => {
    const context = contextWith(
      { workAdded: true, hasRescue: true, rescueYears: '20', earlyYearsPicked: '5' },
      { age65: { ...initialAge65(), mode: 'defer', years: 2 } },
    );

    expect(changesOf(context)).toContainEqual({ kind: 'statePensionStart', age: 67 });
  });

  describe('special pension', () => {
    const specialFrom = (startAge: string) =>
      contextWith(
        { workAdded: true, hasSpecialPension: true, specialPensionStartAge: startAge },
        { specialPension: { ...initialSpecialPension(), monthly: '1500' } },
      );

    it('says when it starts after the pension age and takes the place of the old-age pension', () => {
      expect(changesOf(specialFrom('67'))).toContainEqual({ kind: 'specialPensionStart', age: 67 });
    });

    it('does not say it starts when the chart itself starts there', () => {
      expect(changesOf(specialFrom('58')).map(({ kind }) => kind)).not.toContain(
        'specialPensionStart',
      );
    });
  });

  it('says when the fund pension contract ends and how long it was', () => {
    const context = contextWith(
      {},
      {
        age60: { ...initialAge60(), secondPillar: 'fund' },
        age65: { ...initialAge65(), secondPillar: 'fund' },
        age66: { ...initialAge66(), secondPillarContract: 'once' },
      },
    );
    const { fundPensionContracts } = resultOf(context);
    const contract = fundPensionContracts.second;

    expect(contract).not.toBeNull();
    expect(changesOf(context)).toContainEqual({
      kind: 'fundEnd',
      age: contract?.end,
      pillars: 'second',
      years: (contract?.end ?? 0) - (contract?.start ?? 0),
    });
  });

  it('says the rescue allowance ends without the old-age pension starting when the saver deferred it', () => {
    const context = contextWith(
      { workAdded: true, hasRescue: true, rescueYears: '20', earlyYearsPicked: '5' },
      { age65: { ...initialAge65(), mode: 'defer', years: 2 } },
    );

    expect(changesOf(context)).toContainEqual({
      kind: 'rescueAllowanceEnd',
      age: 65,
      pensionStarts: false,
    });
  });

  it('keeps both contracts that end at the same age', () => {
    const result = resultOf(contextWith());
    const endings: ChartEvent[] = [
      { kind: 'fundEnd', age: 95, pillars: 'second', years: 30 },
      { kind: 'fundEnd', age: 95, pillars: 'third', years: 25 },
    ];

    expect(
      chartChangesOf(result, chartRowsOf(result, NEED), endings).filter(
        ({ kind }) => kind === 'fundEnd',
      ),
    ).toEqual([
      { kind: 'fundEnd', age: 95, pillars: 'second', years: 30 },
      { kind: 'fundEnd', age: 95, pillars: 'third', years: 25 },
    ]);
  });

  it('marks the higher pension after working past the pension age as the end of the work, not as a rise', () => {
    const context = contextWith(
      { grossMonthly: '3000' },
      { age65: { ...initialAge65(), work: 'yes', workUntil: '68' } },
    );
    const kinds = changesOf(context).map(({ kind }) => kind);

    expect(kinds).toContain('workEnd');
    expect(kinds).not.toContain('statePensionRise');
  });

  it('says when the work ends', () => {
    const context = contextWith({}, { age65: { ...initialAge65(), work: 'yes', workUntil: '68' } });

    expect(changesOf(context)).toContainEqual({ kind: 'workEnd', age: 68 });
  });
});
