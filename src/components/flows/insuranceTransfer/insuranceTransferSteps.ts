export type InsuranceTransferStepPath = 'contact-details' | 'selection' | 'request' | 'done';

export const insuranceTransferSteps = ({
  contactDetailsMissing,
  selectionComplete,
}: {
  contactDetailsMissing: boolean;
  selectionComplete: boolean;
}): InsuranceTransferStepPath[] => [
  ...(contactDetailsMissing ? (['contact-details'] as const) : []),
  ...(selectionComplete ? [] : (['selection'] as const)),
  'request',
  'done',
];

export const skipsAStepToDo = (
  stepPaths: InsuranceTransferStepPath[],
  addressedStep: string | undefined,
): boolean => {
  const [firstStep] = stepPaths;
  const firstStepIsToDo = firstStep === 'contact-details' || firstStep === 'selection';
  return firstStepIsToDo && addressedStep !== firstStep;
};
