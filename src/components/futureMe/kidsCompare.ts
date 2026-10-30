import lifeTableData from './engine/lifeTable.json';
import {
  AVG_OLD_AGE_PENSION,
  childSupplement,
  FirstPillarChoice,
  LifeTable,
  PensionInput,
  retirementYears,
  simulate,
  SimulationResult,
  specialStart,
} from './engine/pension';
import { ageTense } from './planAges';
import { ResultContext } from './resultAnswers';
import { pensionInputOf } from './specialPensionAnswers';
import {
  amountOf,
  earlyRightSources,
  isRescueBasisAsked,
  isRescueMixOffered,
  pensionAgeValue,
  RescueBasis,
  toStepPlanInput,
  YouAnswers,
} from './youAnswers';

const lifeTable: LifeTable = lifeTableData;
const WITHOUT_DEFERRAL = { id: 'compare' };
const MONTHS_IN_YEAR = 12;

type CompareContext = Pick<ResultContext, 'you' | 'plan' | 'age65' | 'age66' | 'specialPension'>;

export type SupplementState = 'otherParent' | 'none' | 'self' | 'split';

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

interface SpecialOption {
  from: number;
  monthly: number;
  total: number;
  atPensionAge: number;
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

const basesOf = (you: YouAnswers): RescueBasis[] =>
  isRescueMixOffered(you) ? ['mix', 'pension', 'toetus'] : ['pension', 'toetus'];

const isEarliestStartAhead = ({ you, plan }: CompareContext): boolean => {
  const earliestStart = Math.min(
    ...basesOf(you).map((basis) => pensionAgeValue(answersFor(you, basis))),
  );
  return ageTense(plan.birthYear, earliestStart) !== 'past';
};

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

const supplementOf = (input: PensionInput): SupplementState => {
  const kids = input.kids ?? {};
  if ((kids.supUser || kids.user) === 'other') {
    return 'otherParent';
  }
  if (childSupplement(input) === 0) {
    return 'none';
  }
  return kids.supUser === 'split' ? 'split' : 'self';
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
  isRescueBasisAsked(context.you) &&
  !isSpecialPensionCounted(context) &&
  isEarliestStartAhead(context);

export const rescueComparisonOf = (context: CompareContext) => {
  const input = compareInputOf(context);
  const pensionAge = retirementYears(input);
  const rows = basesOf(context.you).map((basis) => rescueRowOf(context, basis, pensionAge));
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

export const isSpecialComparisonShown = (context: CompareContext): boolean => {
  const input = compareInputOf(context);
  const kidsYears = kidsYearsOf(context.you);
  const earlyYearForKids = retirementYears(input) - kidsYears;
  return (
    input.spHas &&
    (input.spMonthly ?? 0) > 0 &&
    (input.soodus ?? 0) > 0 &&
    !input.flexEarly &&
    input.kids?.earlyUser === 'me' &&
    kidsYears > 0 &&
    ageTense(context.plan.birthYear, earlyYearForKids) !== 'past' &&
    specialStart(input) <= earlyYearForKids
  );
};

const specialAndStatePension = (row: SimulationResult['rows'][number]): number =>
  row.ispg + row.i1g;

const specialOptionOf = (
  input: PensionInput,
  choice: FirstPillarChoice,
  pensionAge: number,
): SpecialOption & { isOldAgeAtPensionAge: boolean } => {
  const simulation = simulate(
    { ...input, firstPillarChoice: choice, firstPillarChoicePa: undefined },
    lifeTable,
    WITHOUT_DEFERRAL,
  );
  return {
    from: simulation.pensionStartAge,
    monthly: monthlyAt(simulation, simulation.pensionStartAge, specialAndStatePension),
    total: totalBefore(simulation, pensionAge, specialAndStatePension),
    atPensionAge: monthlyAt(simulation, pensionAge, specialAndStatePension),
    isOldAgeAtPensionAge: simulation.firstPillar?.atPa?.paid === 'oldAge',
  };
};

const withEarlyRetirementForKidsOnly = (input: PensionInput, kidsYears: number): PensionInput => ({
  ...input,
  soodus: kidsYears,
  rescueBasis: 'pension',
});

export const specialComparisonOf = (context: CompareContext) => {
  const input = compareInputOf(context);
  const pensionAge = retirementYears(input);
  const kidsYears = kidsYearsOf(context.you);
  const kidsOnlyInput = withEarlyRetirementForKidsOnly(input, kidsYears);
  const special = specialOptionOf(kidsOnlyInput, 'special', pensionAge);
  const oldAge = specialOptionOf(kidsOnlyInput, 'oldAge', pensionAge);
  const larger: FirstPillarChoice = special.monthly >= oldAge.monthly ? 'special' : 'oldAge';
  return {
    pensionAge,
    kidsYears,
    special,
    oldAge,
    family: familyOf(kidsYears, special.total),
    supplement: supplementOf(input),
    current: input.firstPillarChoice ?? larger,
    isSpecialHigher: larger === 'special',
  };
};
