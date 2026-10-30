import { initialAge60 } from './age60Answers';
import { initialAge65 } from './age65Answers';
import { initialAge66 } from './age66Answers';
import { initialExpenses, withLevel } from './expensesAnswers';
import { keepSecondPillarGrowing, legacyOf } from './legacy';
import { ResultContext, resultOf } from './resultAnswers';
import { initialSpecialPension } from './specialPensionAnswers';
import { initialAnswers, toStepPlanInput } from './youAnswers';

const noPrefill = { birthYear: 1980, sex: null, secondPillarRate: null };

const contextWith = (
  changes: Partial<ReturnType<typeof initialAnswers>> = {},
  rest: Partial<Omit<ResultContext, 'you' | 'plan'>> = {},
): ResultContext => {
  const you = {
    ...initialAnswers(noPrefill),
    pensionAgeYears: '65',
    firstPillarMonthly: '700',
    grossMonthly: '2000',
    secondPillarAmount: '10000',
    secondPillarReturnPercent: 4,
    thirdPillarReturnPercent: 4,
    ...changes,
  };
  return {
    you,
    plan: toStepPlanInput(you),
    age60: initialAge60(),
    age65: initialAge65(),
    age66: initialAge66(),
    specialPension: initialSpecialPension(),
    expenses: initialExpenses(),
    ...rest,
  };
};

const legacyFor = (context: ResultContext) => legacyOf(context, resultOf(context));

const wealthy = () => contextWith({ secondPillarAmount: '400000' });
const costsTooHigh = () =>
  contextWith(
    { firstPillarMonthly: '300' },
    { expenses: withLevel(initialExpenses(), 'comfortable') },
  );
const takenAsLumpSum = () =>
  contextWith(
    { firstPillarMonthly: '300' },
    {
      age60: { ...initialAge60(), secondPillar: 'lump' },
      expenses: withLevel(initialExpenses(), 'comfortable'),
    },
  );

const gapThatClosesAgain = () =>
  contextWith(
    { birthYear: '1962', firstPillarMonthly: '1200', grossMonthly: '0', secondPillarAmount: '0' },
    { age65: { ...initialAge65(), mode: 'defer' as const, years: 1 } },
  );

const earlyGapThenLateGap = () =>
  contextWith({
    sex: 'M',
    workAdded: true,
    hazardList: 'list1',
    hazardYears: '15',
    firstPillarMonthly: '500',
    grossMonthly: '0',
    secondPillarAmount: '50000',
  });

describe('legacyOf', () => {
  it('has money left at the median age of someone whose pensions out-earn the costs', () => {
    const legacy = legacyFor(wealthy());

    expect(legacy.kind).toBe('surplus');
  });

  it('reports the money left at the median age: the first age at most half of those now the same age reach', () => {
    const context = wealthy();
    const result = resultOf(context);
    const atMostHalfAlive = result.rows.find((row) => row.alive <= 0.5);

    expect(legacyOf(context, result)).toMatchObject({
      medianAge: atMostHalfAlive?.age,
      left: atMostHalfAlive?.moneyLeft,
    });
  });

  it('reports what the plan can carry to the end and how much more that is than the frugal costs', () => {
    const context = wealthy();
    const result = resultOf(context);

    expect(legacyOf(context, result)).toMatchObject({
      sustainable: result.sustainable,
      costs: 791,
      extra: result.sustainable - 791,
    });
  });

  it('has no money left over when the costs are no longer covered by the median age', () => {
    expect(legacyFor(costsTooHigh()).kind).toBe('shortfall');
  });

  it('does not read a gap that closes again as no money left', () => {
    const context = gapThatClosesAgain();

    expect(resultOf(context).gapTemporary).toBe(true);
    expect(legacyFor(context).kind).toBe('surplus');
  });

  it('has money left when an early gap closes and the costs run short again only after the median age', () => {
    const context = earlyGapThenLateGap();
    const result = resultOf(context);
    const legacy = legacyOf(context, result);

    expect(result.coversNeedUntil).toBe(55);
    expect(result.gapTemporary).toBe(false);
    expect(legacy).toMatchObject({ kind: 'surplus', medianAge: 79 });
    const { medianAge } = legacy as { medianAge: number };
    expect(result.rows.find((row) => row.age === medianAge)?.shortfall).toBe(0);
    expect(result.rows.some((row) => row.age > medianAge && row.shortfall > 0.5)).toBe(true);
  });

  it('suggests keeping the second pillar growing only when it was taken out as a lump sum', () => {
    expect(legacyFor(takenAsLumpSum())).toMatchObject({
      kind: 'shortfall',
      isGrowingSecondPillarSuggested: true,
    });
    expect(legacyFor(costsTooHigh())).toMatchObject({
      kind: 'shortfall',
      isGrowingSecondPillarSuggested: false,
    });
  });

  it('does not suggest keeping the second pillar growing when the fund loses value after inflation', () => {
    const context = takenAsLumpSum();
    const belowInflation = { ...context, you: { ...context.you, secondPillarReturnPercent: 1 } };

    expect(legacyFor(belowInflation)).toMatchObject({
      kind: 'shortfall',
      isGrowingSecondPillarSuggested: false,
    });
  });

  it('suggests keeping the second pillar in the fund at a 2% return, where it keeps its value', () => {
    const context = takenAsLumpSum();
    const atInflation = { ...context, you: { ...context.you, secondPillarReturnPercent: 2 } };

    expect(legacyFor(atInflation)).toMatchObject({
      kind: 'shortfall',
      isGrowingSecondPillarSuggested: true,
      secondPillarReturn: 0,
    });
  });
});

describe('keepSecondPillarGrowing', () => {
  it('leaves the second pillar growing at the payout age and again at the pension age', () => {
    const context = {
      ...takenAsLumpSum(),
      age65: { ...initialAge65(), secondPillar: 'lump' as const },
    };

    const changes = keepSecondPillarGrowing(context);

    expect(changes.age60?.secondPillar).toBe('grow');
    expect(changes.age65?.secondPillar).toBe('grow');
  });
});
