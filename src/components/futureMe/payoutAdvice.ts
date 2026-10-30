import { payoutAge } from './planAges';
import { isPayoutChoiceMadeAtAnotherStep, withMode } from './age65Answers';
import { Contract, contractEndAgeOf, hasPillar, payoutAtPensionAge } from './age66Answers';
import { DecisionChanges, DecisionId } from './decisions';
import lifeTableData from './engine/lifeTable.json';
import {
  bestDeferral,
  LifeTable,
  options,
  PensionInput,
  Scenario,
  SCENARIOS,
  SimulationRow,
  sustainableNeed,
} from './engine/pension';
import {
  keepGrowing,
  Result,
  ResultContext,
  resultInputOf,
  resultScenarioOf,
} from './resultAnswers';
import { FutureMeStep, StepId } from './steps';

const lifeTable: LifeTable = lifeTableData;
const BRIDGE_DEFERRAL_WITHOUT_CHOICE = 2;
const SURPLUS_MIN_MONTHLY = 20;
const SURPLUS_MIN_YEARS = 3;

export interface HowTo {
  kind: 'lump' | 'grow' | 'contract' | 'bridge' | 'fund';
  contract: Contract;
  deferral: number;
  atPayoutAge: boolean;
  payoutAge: number;
}

export type PayoutWarning =
  | {
      kind: 'shorterDeferral';
      until: number;
      deferral: number;
      shorter: number;
      pensionAge: number;
    }
  | {
      kind: 'betterPayout';
      until: number;
      scenarioId: string;
      best: number;
      mine: number;
      how: HowTo;
    }
  | { kind: 'noPayoutCovers'; until: number; most: number };

export interface SurplusTip {
  from: number;
  to: number;
  average: number;
  grow: number | null;
  mine: number;
  decision: DecisionId;
}

const isFundPensionChosen = (context: ResultContext): boolean =>
  hasPillar('secondPillar', context) && payoutAtPensionAge('secondPillar', context) === 'fund';

const isChosenAtPayoutAge = ({ age60, plan }: ResultContext): boolean =>
  age60.secondPillar !== 'grow' || isPayoutChoiceMadeAtAnotherStep(plan);

export const howToChoose = (scenario: Scenario, context: ResultContext): HowTo => {
  const { plan } = context;
  const chosenDeferral = resultScenarioOf(context).deferral ?? 0;
  const isFundChosen = isFundPensionChosen(context);
  const base = {
    contract: (scenario.id === 'B' || scenario.contract === 'once' ? 'once' : 'yearly') as Contract,
    deferral: scenario.deferral ?? 0,
    atPayoutAge: isChosenAtPayoutAge(context),
    payoutAge: payoutAge(plan),
  };
  if (scenario.id === 'A') {
    return { ...base, kind: 'lump' };
  }
  if (scenario.id === 'E') {
    return { ...base, kind: 'grow' };
  }
  if (scenario.id === 'C') {
    const isOnlyContractDifferent = isFundChosen && chosenDeferral === scenario.deferral;
    return { ...base, kind: isOnlyContractDifferent ? 'contract' : 'bridge' };
  }
  return { ...base, kind: isFundChosen ? 'contract' : 'fund' };
};

export const stepToChoose = ({ kind, atPayoutAge }: HowTo, context: ResultContext): StepId => {
  if (kind === 'contract') {
    return FutureMeStep.AGE_66_PLUS;
  }
  const isOnlyDeferralLeft = kind === 'bridge' && isFundPensionChosen(context);
  return atPayoutAge && !isOnlyDeferralLeft ? FutureMeStep.AGE_60 : FutureMeStep.AGE_65;
};

export const deferralChanges = ({ age65 }: ResultContext, years: number): DecisionChanges => ({
  age65: years === 0 ? withMode(age65, 'full') : { ...withMode(age65, 'defer'), years },
});

const timingOf = (scenario: Scenario) => ({
  deferral: scenario.deferral ?? 0,
  half: scenario.half ?? 0,
});

const comparedScenarios = (context: ResultContext, chosen: Scenario): Scenario[] => {
  const isDeferralOpen = options(resultInputOf(context)).deferral.open;
  const isFundChosen = isFundPensionChosen(context);
  const endAge = contractEndAgeOf('secondPillar', context.age66, context);
  const asAdvised = (scenario: Scenario): Scenario => {
    if (scenario.id === 'C') {
      return {
        ...scenario,
        half: 0,
        deferral: chosen.deferral || BRIDGE_DEFERRAL_WITHOUT_CHOICE,
        contract: context.age66.secondPillarContract,
        endAge,
      };
    }
    const isFundPensionAdvised = scenario.id === 'B' || scenario.id === 'D';
    const advised = { ...scenario, endAge };
    return isFundPensionAdvised && !isFundChosen ? advised : { ...advised, ...timingOf(chosen) };
  };
  return [...SCENARIOS, keepGrowing]
    .filter(({ id }) => id !== 'C' || isDeferralOpen)
    .map((scenario) => (scenario.id === chosen.id ? chosen : asAdvised(scenario)));
};

const carriedBy = (input: PensionInput, scenario: Scenario): number =>
  sustainableNeed(input, lifeTable, scenario);

export const payoutWarningOf = (context: ResultContext, result: Result): PayoutWarning | null => {
  const until = result.coversNeedUntil;
  if (until === null || until > result.horizonAge) {
    return null;
  }
  const input = resultInputOf(context);
  const scenario = resultScenarioOf(context);
  const deferral = scenario.deferral ?? 0;
  if (deferral > 0) {
    const shorter = bestDeferral(input, lifeTable, scenario);
    if (shorter !== null && shorter < deferral) {
      return {
        kind: 'shorterDeferral',
        until,
        deferral,
        shorter,
        pensionAge: result.pensionStartAge,
      };
    }
  }
  const compared = comparedScenarios(context, scenario).map((candidate) => ({
    candidate,
    carries: carriedBy(input, candidate),
  }));
  const best = compared.reduce((most, next) => (next.carries > most.carries ? next : most));
  if (best.carries > result.sustainable) {
    return {
      kind: 'betterPayout',
      until,
      scenarioId: best.candidate.id,
      best: best.carries,
      mine: result.sustainable,
      how: howToChoose(best.candidate, context),
    };
  }
  return { kind: 'noPayoutCovers', until, most: Math.max(best.carries, result.sustainable) };
};

const surplusOf = (row: SimulationRow): number =>
  row.fp > 0.5 && !row.work ? Math.max(0, row.i1 + row.isp + row.i23 + row.dep - row.spend) : 0;

const longestSurplusRun = (rows: SimulationRow[]): SimulationRow[] =>
  rows
    .reduce<SimulationRow[][]>(
      (runs, row) => {
        if (surplusOf(row) <= SURPLUS_MIN_MONTHLY) {
          return [...runs, []];
        }
        const last = runs[runs.length - 1];
        return [...runs.slice(0, -1), [...last, row]];
      },
      [[]],
    )
    .reduce((longest, run) => (run.length > longest.length ? run : longest));

export const surplusTipOf = (context: ResultContext, result: Result): SurplusTip | null => {
  if (!isFundPensionChosen(context)) {
    return null;
  }
  const run = longestSurplusRun(result.rows.filter(({ age }) => age >= result.pensionStartAge));
  if (run.length < SURPLUS_MIN_YEARS) {
    return null;
  }
  const chosen = resultScenarioOf(context);
  const grow = carriedBy(resultInputOf(context), { ...keepGrowing, ...timingOf(chosen) });
  return {
    from: run[0].age,
    to: run[run.length - 1].age,
    average: run.reduce((sum, row) => sum + surplusOf(row), 0) / run.length,
    grow: grow > result.sustainable ? grow : null,
    mine: result.sustainable,
    decision: isChosenAtPayoutAge(context) ? 'secondPillarAtPayoutAge' : 'secondPillarAtPensionAge',
  };
};
