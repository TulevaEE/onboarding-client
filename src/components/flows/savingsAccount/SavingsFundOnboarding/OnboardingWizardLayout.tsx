import { FC, ReactNode } from 'react';

interface OnboardingWizardLayoutProps {
  currentStep: number;
  totalSteps: number;
  children: ReactNode;
}

export const OnboardingWizardLayout: FC<OnboardingWizardLayoutProps> = ({
  currentStep,
  totalSteps,
  children,
}) => {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div>
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
      {children}
    </div>
  );
};
