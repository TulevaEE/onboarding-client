import {
  Age66Answers,
  Age66Context,
  contractChosenAt,
  isContractAsked,
  isGrowing,
  Pillar,
} from './age66Answers';
import { firstPillarComparison, SpecialPensionAnswers } from './specialPensionAnswers';

const PILLARS: Pillar[] = ['secondPillar', 'thirdPillar'];

export const isAge66StepNeeded = (
  answers: Age66Answers,
  context: Age66Context,
  specialPension: SpecialPensionAnswers,
): boolean => {
  const { you, plan, age65 } = context;
  const isFirstPillarAsked =
    plan.hasSpecialPension &&
    Boolean(firstPillarComparison(specialPension, you, plan, age65, answers)?.atPa);
  return (
    isFirstPillarAsked ||
    PILLARS.some(
      (pillar) =>
        contractChosenAt(pillar, context) === null &&
        (isGrowing(pillar, context) || isContractAsked(pillar, answers, context)),
    )
  );
};
