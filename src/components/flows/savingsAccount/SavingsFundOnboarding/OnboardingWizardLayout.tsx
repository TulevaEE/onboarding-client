import { FC, ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

interface OnboardingWizardLayoutProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  children: ReactNode;
}

export const OnboardingWizardLayout: FC<OnboardingWizardLayoutProps> = ({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  children,
}) => {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="d-flex flex-column gap-5">
      <div className="d-flex flex-column gap-4">
        <div className="d-flex align-items-center gap-2">
          <div
            className="progress flex-fill"
            role="progressbar"
            aria-hidden="true"
            style={{ height: '8px' }}
          >
            <div className="progress-bar" style={{ width: `${progressPercentage}%` }} />
          </div>
          <span className="fs-xs lh-1 text-secondary fw-medium">
            {currentStep}/{totalSteps}
          </span>
        </div>
        <h1 className="m-0">
          <FormattedMessage id="flows.savingsFundOnboarding.title" />
        </h1>
      </div>
      {children}
      <div className="d-flex flex-column-reverse flex-sm-row justify-content-between pt-4 border-top gap-3">
        <button type="button" className="btn btn-lg btn-light" onClick={onBack}>
          <FormattedMessage id="savingsFundOnboarding.back" />
        </button>
        <button type="button" className="btn btn-lg btn-primary" onClick={onNext}>
          <FormattedMessage id="savingsFundOnboarding.continue" />
        </button>
      </div>
    </div>
  );
};
