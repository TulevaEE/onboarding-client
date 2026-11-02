import { PensionInput, retirementYears, specialStart } from './engine/pension';
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
  YouAnswers,
} from './youAnswers';

type CompareContext = Pick<ResultContext, 'you' | 'plan' | 'age65' | 'age66' | 'specialPension'>;

const isSpecialPensionCounted = ({ plan, specialPension }: CompareContext): boolean =>
  plan.hasSpecialPension && amountOf(specialPension.monthly) > 0;

const compareInputOf = (context: CompareContext): PensionInput => {
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

export const isRescueComparisonShown = (context: CompareContext): boolean =>
  isRescueBasisAsked(context.you) &&
  !isSpecialPensionCounted(context) &&
  isEarliestStartAhead(context);

export const isSpecialComparisonShown = (context: CompareContext): boolean => {
  const input = compareInputOf(context);
  const kidsYears = kidsYearsOf(context.you);
  const earlyYearForKids = retirementYears(input) - kidsYears;
  return (
    !!input.spHas &&
    (input.spMonthly ?? 0) > 0 &&
    (input.soodus ?? 0) > 0 &&
    !input.flexEarly &&
    input.kids?.earlyUser === 'me' &&
    kidsYears > 0 &&
    ageTense(context.plan.birthYear, earlyYearForKids) !== 'past' &&
    specialStart(input) <= earlyYearForKids
  );
};

export const kidsRightAgesOf = (context: CompareContext) => {
  const pensionAge = retirementYears(compareInputOf(context));
  const kidsYears = kidsYearsOf(context.you);
  return { pensionAge, kidsYears, kidsFrom: pensionAge - kidsYears };
};
