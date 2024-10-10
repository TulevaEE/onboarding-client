import { useWithdrawalsContext } from './hooks';

export const StepButtons = ({ canProceed = true }: { canProceed?: boolean }) => {
  const { navigateToNextStep, navigateToPreviousStep } = useWithdrawalsContext();

  return (
    <div className="d-flex justify-content-between pt-4">
      {/* TODO paddings */}
      <button type="button" className="btn btn-light" onClick={() => navigateToPreviousStep()}>
        Tagasi
      </button>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => navigateToNextStep()}
        disabled={!canProceed}
      >
        Jätkan
      </button>
    </div>
  );
};
