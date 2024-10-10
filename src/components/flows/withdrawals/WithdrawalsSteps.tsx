import { FormattedMessage } from 'react-intl';
import { TranslationKey } from '../../translations';
import { useWithdrawalsContext } from './hooks';
import { WITHDRAWAL_STEPS } from './constants';

export const WithdrawalsSteps = () => {
  const { currentStepNumber } = useWithdrawalsContext();

  return (
    <div className="tv-steps d-flex justify-content-between">
      {WITHDRAWAL_STEPS.map((step, idx) => (
        <WithdrawalStep
          key={step.type}
          step={idx}
          currentStep={currentStepNumber}
          titleId={step.titleId}
        />
      ))}
    </div>
  );
};

const WithdrawalStep = ({
  step,
  currentStep,
  titleId,
}: {
  step: number;
  currentStep: number;
  titleId: TranslationKey;
}) => {
  const isStepCompleted = currentStep > step;
  const isStepUpcoming = currentStep < step;
  const isCurrentStep = currentStep === step;

  if (isStepCompleted) {
    return (
      <div className="tv-step__title tv-step__title--previous">
        <span className="tv-step__number mr-2">
          <Checkmark />
        </span>
        <FormattedMessage id={titleId} />
      </div>
    );
  }

  if (isCurrentStep) {
    return (
      <div className="tv-step__title tv-step__title--current">
        <span className="tv-step__number mr-2">{step + 1}</span>
        <FormattedMessage id={titleId} />
      </div>
    );
  }

  if (isStepUpcoming) {
    return (
      <div className="tv-step__title tv-step__title--upcoming">
        <span className="tv-step__number mr-2">{step + 1}</span>
        <FormattedMessage id={titleId} />
      </div>
    );
  }

  return null;
};

const Checkmark = () => (
  <svg width="17" height="12" viewBox="0 0 17 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M6.05021 9.15L14.5252 0.675C14.7252 0.475 14.9627 0.375 15.2377 0.375C15.5127 0.375 15.7502 0.475 15.9502 0.675C16.1502 0.875 16.2502 1.1125 16.2502 1.3875C16.2502 1.6625 16.1502 1.9 15.9502 2.1L6.75021 11.3C6.55021 11.5 6.31687 11.6 6.05021 11.6C5.78354 11.6 5.55021 11.5 5.35021 11.3L1.05021 7C0.850207 6.8 0.754374 6.5625 0.762707 6.2875C0.77104 6.0125 0.875207 5.775 1.07521 5.575C1.27521 5.375 1.51271 5.275 1.78771 5.275C2.06271 5.275 2.30021 5.375 2.50021 5.575L6.05021 9.15Z"
      fill="#0081EE"
    />
  </svg>
);
