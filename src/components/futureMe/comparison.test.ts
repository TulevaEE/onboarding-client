import { initialAge60 } from './age60Answers';
import { initialAge65 } from './age65Answers';
import { initialAge66 } from './age66Answers';
import { bestColumnsOf, comparisonOf, comparisonRowsOf, comparisonScenariosOf } from './comparison';
import { initialExpenses } from './expensesAnswers';
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

const idsOf = (context: ResultContext) => comparisonScenariosOf(context).map(({ id }) => id);

describe('comparison', () => {
  describe('payout routes compared', () => {
    it('compares every way of taking the II pillar out, and keeping it growing', () => {
      expect(idsOf(contextWith())).toEqual(['A', 'B', 'C', 'D', 'E']);
    });

    it('leaves out the bridge to a later state pension next to a special pension', () => {
      const withSpecialPension = contextWith(
        { workAdded: true, hasSpecialPension: true },
        { specialPension: { ...initialSpecialPension(), monthly: '800' } },
      );

      expect(idsOf(withSpecialPension)).not.toContain('C');
    });

    it('postpones the state pension by 2 years in the bridge unless a longer time is chosen', () => {
      const bridge = (context: ResultContext) =>
        comparisonScenariosOf(context).find(({ id }) => id === 'C');
      const defers = (years: number) =>
        contextWith({}, { age65: { ...initialAge65(), mode: 'defer', years } });

      expect(bridge(contextWith())).toMatchObject({ deferral: 2 });
      expect(bridge(defers(4))).toMatchObject({ deferral: 4 });
    });

    it('keeps the chosen state pension timing in the other routes', () => {
      const age65 = { ...initialAge65(), mode: 'half' as const, years: 3 };
      const scenarios = comparisonScenariosOf(contextWith({}, { age65 }));

      expect(scenarios.find(({ id }) => id === 'A')).toMatchObject({ half: 3 });
    });
  });

  describe('columns', () => {
    const mineOf = (context: ResultContext) => comparisonOf(context).find(({ isMine }) => isMine);

    it('marks the route the answers lead to as the user’s own', () => {
      expect(mineOf(contextWith())?.id).toBe('E');
      expect(
        mineOf(contextWith({}, { age60: { ...initialAge60(), secondPillar: 'lump' } }))?.id,
      ).toBe('A');
    });

    it('gives the user’s own column the same result as the answer above', () => {
      const context = contextWith();

      expect(mineOf(context)?.result.sustainable).toBe(resultOf(context).sustainable);
    });

    it('shows a different result for a route that pays out differently', () => {
      const columns = comparisonOf(contextWith());
      const sustainable = (id: string) =>
        columns.find((column) => column.id === id)?.result.sustainable;

      expect(sustainable('A')).not.toBe(sustainable('E'));
    });
  });

  describe('rows', () => {
    const result = { ...resultOf(contextWith()), coversNeedUntil: null, moneyEndAge: null };

    it('counts costs covered for life and money that never ends as longer than any age shown', () => {
      const [covers, , moneyEnd] = comparisonRowsOf(result);

      expect(covers.value).toBe(101);
      expect(moneyEnd.value).toBe(101);
    });

    it('has no one in danger of outliving the money when the costs are covered for life', () => {
      const [, outlived] = comparisonRowsOf(result);

      expect(outlived.value).toBe(0);
    });

    it('lists how much is spent at 90, what lasts for life and the expected total', () => {
      expect(comparisonRowsOf(result).map(({ id }) => id)).toEqual([
        'covers',
        'outlived',
        'moneyEnd',
        'spendAt90',
        'sustainable',
        'expectedLifetime',
      ]);
    });
  });

  describe('best column', () => {
    it('is the column with the highest value', () => {
      expect(bestColumnsOf([10, 30, 20])).toEqual([1]);
    });

    it('is every column sharing the highest value', () => {
      expect(bestColumnsOf([30, 10, 30])).toEqual([0, 2]);
    });

    it('is none when all columns are equal', () => {
      expect(bestColumnsOf([20, 20, 20])).toEqual([]);
    });
  });
});
