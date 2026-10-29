import lifeTableData from './engine/lifeTable.json';
import {
  AVG_OLD_AGE_PENSION,
  childSupplement,
  LifeTable,
  PensionInput,
  retirementYears,
  simulate,
  SimulationResult,
} from './engine/pension';
import { ResultContext } from './resultAnswers';
import { pensionInputOf } from './specialPensionAnswers';
import {
  amountOf,
  earlyRightSources,
  isRescueBasisAsked,
  isRescueMixOffered,
  RescueBasis,
  toStepPlanInput,
  YouAnswers,
} from './youAnswers';

const lifeTable: LifeTable = lifeTableData;
const WITHOUT_DEFERRAL = { id: 'compare' };
const MONTHS_IN_YEAR = 12;

type CompareContext = Pick<ResultContext, 'you' | 'plan' | 'age65' | 'age66' | 'specialPension'>;

export type SupplementState = 'otherParent' | 'none' | 'unknown' | 'no' | 'yes';

interface Period {
  from: number;
  to: number;
  monthly: number;
}

export interface RescueRow {
  basis: RescueBasis;
  workUntil: number;
  toetus: Period | null;
  pension: Period | null;
  total: number;
  atPensionAge: number;
}

export interface Family {
  kidsYears: number;
  partnerMonthly: number;
  partnerTotal: number;
  total: number;
}

const isSpecialPensionCounted = ({ plan, specialPension }: CompareContext): boolean =>
  plan.hasSpecialPension && amountOf(specialPension.monthly) > 0;

const compareInputOf = (context: CompareContext) => {
  const { you, plan, age65, age66, specialPension } = context;
  const hasSpecialPension = isSpecialPensionCounted(context);
  return {
    ...pensionInputOf(specialPension, you, plan, age65, age66),
    spHas: hasSpecialPension,
    spMonthly: hasSpecialPension ? amountOf(specialPension.monthly) : 0,
  };
};

const kidsYearsOf = (you: YouAnswers): number => earlyRightSources(you).kids;

const answersFor = (you: YouAnswers, basis: RescueBasis): YouAnswers => ({
  ...you,
  rescueBasis: basis,
  earlyYearsPicked: '',
});

const rowInputOf = (context: CompareContext, basis: RescueBasis): PensionInput => {
  const you = answersFor(context.you, basis);
  const input = compareInputOf({ ...context, you, plan: toStepPlanInput(you) });
  return { ...input, kids: { ...input.kids, yearsEarly: kidsYearsOf(you) }, workOn: false };
};

const familyOf = (kidsYears: number, ownTotal: number): Family => {
  const partnerTotal = AVG_OLD_AGE_PENSION * MONTHS_IN_YEAR * kidsYears;
  return {
    kidsYears,
    partnerMonthly: AVG_OLD_AGE_PENSION,
    partnerTotal,
    total: ownTotal + partnerTotal,
  };
};

const supplementOf = (input: PensionInput) => {
  const monthly = childSupplement(input);
  const kids = input.kids ?? {};
  const isOtherParents = (kids.supUser || kids.user) === 'other';
  const forecastState = (kids.inForecast ?? 'unknown') as SupplementState;
  const state: SupplementState = isOtherParents ? 'otherParent' : forecastState;
  return { monthly, state: monthly > 0 || isOtherParents ? state : 'none' };
};

const monthlyAt = (
  simulation: SimulationResult,
  age: number,
  amountIn: (row: SimulationResult['rows'][number]) => number,
): number => {
  const row = simulation.rows.find((candidate) => candidate.age === age);
  return row ? amountIn(row) : 0;
};

const totalBefore = (
  simulation: SimulationResult,
  pensionAge: number,
  amountIn: (row: SimulationResult['rows'][number]) => number,
): number =>
  simulation.rows
    .filter(({ age }) => age >= simulation.pensionStartAge && age < pensionAge)
    .reduce((sum, row) => sum + amountIn(row) * MONTHS_IN_YEAR, 0);

const statePension = (row: SimulationResult['rows'][number]): number => row.i1g;

const rescueRowOf = (
  context: CompareContext,
  basis: RescueBasis,
  pensionAge: number,
): RescueRow => {
  const simulation = simulate(rowInputOf(context, basis), lifeTable, WITHOUT_DEFERRAL);
  const allowance = simulation.rescueAllowance;
  const pensionFrom = allowance ? allowance.until : simulation.pensionStartAge;
  return {
    basis,
    workUntil: simulation.pensionStartAge,
    toetus: allowance && {
      from: allowance.from,
      to: allowance.until - 1,
      monthly: allowance.monthly,
    },
    pension:
      pensionFrom < pensionAge
        ? {
            from: pensionFrom,
            to: pensionAge - 1,
            monthly: monthlyAt(simulation, pensionFrom, statePension),
          }
        : null,
    total: totalBefore(simulation, pensionAge, statePension),
    atPensionAge: monthlyAt(simulation, pensionAge, statePension),
  };
};

export const isRescueComparisonShown = (context: CompareContext): boolean =>
  isRescueBasisAsked(context.you) && !isSpecialPensionCounted(context);

export const rescueComparisonOf = (context: CompareContext) => {
  const input = compareInputOf(context);
  const pensionAge = retirementYears(input);
  const bases: RescueBasis[] = isRescueMixOffered(context.you)
    ? ['mix', 'pension', 'toetus']
    : ['pension', 'toetus'];
  const rows = bases.map((basis) => rescueRowOf(context, basis, pensionAge));
  const toetus = rows.find(({ basis }) => basis === 'toetus');
  const kidsYears = kidsYearsOf(context.you);
  return {
    pensionAge,
    kidsYears,
    rows,
    family: toetus ? familyOf(kidsYears, toetus.total) : null,
    supplement: supplementOf(input),
    current: input.rescueBasis,
  };
};
