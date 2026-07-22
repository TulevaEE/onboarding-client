import { FC, ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import { Loader } from '../../../common';

interface OnboardingFlowLayoutProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  loading?: boolean;
  submitting?: boolean;
  nextDisabled?: boolean;
  backDisabled?: boolean;
  // Who the account is being opened for, kept under the title on every step. The
  // child flow sets it so the parent never has to remember which child they picked.
  subtitle?: ReactNode;
  children: ReactNode;
}

export const OnboardingFlowLayout: FC<OnboardingFlowLayoutProps> = ({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  loading,
  submitting,
  nextDisabled,
  backDisabled,
  subtitle,
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
        <div className="d-flex flex-column gap-1">
          <h1 className="m-0">
            <FormattedMessage id="flows.savingsFundOnboarding.title" />
          </h1>
          {subtitle ? <p className="m-0 fs-3 text-body-secondary">{subtitle}</p> : null}
        </div>
      </div>
      {loading ? <Loader /> : children}
      {!loading && (
        <div className="d-flex flex-column-reverse flex-sm-row justify-content-between pt-4 border-top gap-3">
          <button
            type="button"
            className="btn btn-lg btn-light"
            onClick={onBack}
            disabled={backDisabled}
          >
            <FormattedMessage id="savingsFundOnboarding.back" />
          </button>
          <button
            type="button"
            className="btn btn-lg btn-primary"
            onClick={onNext}
            disabled={submitting || nextDisabled}
          >
            {submitting && (
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              />
            )}
            <FormattedMessage id="savingsFundOnboarding.continue" />
          </button>
        </div>
      )}
    </div>
  );
};
