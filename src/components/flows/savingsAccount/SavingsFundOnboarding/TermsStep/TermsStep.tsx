import { FC, ReactNode } from 'react';
import { Control, Controller } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { OnboardingFormData } from '../types';

type TermsStepProps = {
  control: Control<OnboardingFormData>;
  showError?: boolean;
};

export const TermsStep: FC<TermsStepProps> = ({ control, showError }) => {
  const intl = useIntl();
  return (
    <section className="d-flex flex-column gap-4" key="conditions">
      <div className="section-header d-flex flex-column gap-1">
        <h2 className="m-0">
          <FormattedMessage id="flows.savingsFundOnboarding.termsStep.title" />
        </h2>
      </div>
      <div className="section-content d-flex flex-column gap-5">
        <div className="d-flex flex-column gap-3">
          <DocumentLink href="https://tuleva.ee/wp-content/uploads/2026/01/Tuleva-Taiendav-Kogumisfond.-Tingimused.-12.01.2026.pdf">
            <FormattedMessage id="flows.savingsFundOnboarding.termsStep.linkText.terms" />
          </DocumentLink>
          <DocumentLink href="https://tuleva.ee/wp-content/uploads/2026/01/Tuleva-Taiendav-Kogumisfond.-Prospekt.-12.01.2026.pdf">
            <FormattedMessage id="flows.savingsFundOnboarding.termsStep.linkText.prospectus" />
          </DocumentLink>
          <DocumentLink href="https://tuleva.ee/wp-content/uploads/2026/01/Tuleva-Taiendav-Kogumisfond.-Pohiteabedokument.-12.01.2026.pdf">
            <FormattedMessage id="flows.savingsFundOnboarding.termsStep.linkText.keyInfo" />
          </DocumentLink>
        </div>
        <Controller
          control={control}
          name="termsAccepted"
          rules={{
            validate: (value) =>
              value === true ||
              intl.formatMessage({ id: 'flows.savingsFundOnboarding.termsStep.error' }),
          }}
          render={({ field, fieldState: { error } }) => (
            <div className="form-check m-0 lead">
              <input
                className="form-check-input"
                type="checkbox"
                id="terms-accepted"
                checked={field.value}
                onChange={field.onChange}
              />
              <label className="form-check-label w-100" htmlFor="terms-accepted">
                <FormattedMessage id="flows.savingsFundOnboarding.termsStep.confirmText" />
              </label>
              {showError && (
                <p className="m-0 text-danger fs-base" role="alert">
                  <FormattedMessage id="flows.savingsFundOnboarding.termsStep.error" />
                </p>
              )}
              {error && error.message ? (
                <p className="m-0 text-danger fs-base" role="alert">
                  {error.message}
                </p>
              ) : null}
            </div>
          )}
        />
      </div>
    </section>
  );
};

const DocumentLink: FC<{ href: string; children: ReactNode }> = ({ href, children }) => (
  <a
    className="d-flex align-items-center gap-2 p-3 p-sm-4 bg-blue-1 border border-blue-2 rounded-3 lead"
    href={href}
    target="_blank"
    rel="noreferrer"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="currentColor"
      viewBox="0 0 16 16"
      aria-hidden="true"
    >
      <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5" />
      <path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z" />
    </svg>
    <span className="flex-fill">{children}</span>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="(avaneb uues aknas)"
    >
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </svg>
  </a>
);
