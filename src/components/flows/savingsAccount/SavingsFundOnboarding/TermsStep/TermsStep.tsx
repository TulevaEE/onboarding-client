import { ReactNode } from 'react';
import { Control, Controller, Path } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { SharedOnboardingFields } from '../types';
import { TranslationKey } from '../../../../translations';

type TermsStepProps<T extends SharedOnboardingFields = SharedOnboardingFields> = {
  control: Control<T>;
  documents: { href: string; labelId: TranslationKey }[];
  showError?: boolean;
  confirmTextId?: TranslationKey;
};

// Phosphor Icons, bold weight (MIT): percent, globe-hemisphere-west, money
const featureIcons: Record<string, ReactNode> = {
  percent: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill="currentColor"
      viewBox="0 0 256 256"
      aria-hidden="true"
    >
      <path d="M208.49,64.47l-144,144a12,12,0,1,1-17-17l144-144a12,12,0,0,1,17,17ZM47.72,104.27A40,40,0,1,1,76,116,39.72,39.72,0,0,1,47.72,104.27ZM60,76a16,16,0,1,0,4.69-11.31A15.87,15.87,0,0,0,60,76ZM220,180a40,40,0,1,1-11.72-28.29A39.71,39.71,0,0,1,220,180Zm-24,0a15.87,15.87,0,0,0-4.69-11.32h0A16,16,0,1,0,196,180Z" />
    </svg>
  ),
  globe: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill="currentColor"
      viewBox="0 0 256 256"
      aria-hidden="true"
    >
      <path d="M128,20A108,108,0,1,0,236,128,108.12,108.12,0,0,0,128,20Zm84,108a83.64,83.64,0,0,1-4.47,27L167,130a19.65,19.65,0,0,0-7.8-2.78l-22.82-3.08A20.14,20.14,0,0,0,117.72,132h-4.07l-2.71-5.6a19.88,19.88,0,0,0-13.8-10.84L94.46,115l4-7h14.39a20,20,0,0,0,9.66-2.49l12.25-6.76a20.57,20.57,0,0,0,3.74-2.68l26.92-24.33A20,20,0,0,0,172,56.49,84,84,0,0,1,212,128ZM140.76,45l6.2,11.1L122.75,78l-10.93,6H96.14A20.05,20.05,0,0,0,78.78,94.06l-4.49,7.85L67.68,84.28l9.91-23.42A83.91,83.91,0,0,1,140.76,45ZM44,128a83.52,83.52,0,0,1,4.4-26.77l7.74,20.65a19.89,19.89,0,0,0,14.52,12.53l19.53,4.2,3,6.1a20.11,20.11,0,0,0,13.55,10.77l-5,11.12a20,20,0,0,0,3.58,21.71l.21.22,18.16,18.7-.89,4.59A84.09,84.09,0,0,1,44,128Zm103.65,81.66a20.11,20.11,0,0,0-5-17.3l-.21-.22-17.72-18.25,11.37-25.52,19,2.56,41.43,25.48A84.2,84.2,0,0,1,147.65,209.66Z" />
    </svg>
  ),
  money: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill="currentColor"
      viewBox="0 0 256 256"
      aria-hidden="true"
    >
      <path d="M240,52H16A12,12,0,0,0,4,64V192a12,12,0,0,0,12,12H240a12,12,0,0,0,12-12V64A12,12,0,0,0,240,52ZM181.21,180H74.79A60.18,60.18,0,0,0,28,133.21V122.79A60.18,60.18,0,0,0,74.79,76H181.21A60.18,60.18,0,0,0,228,122.79v10.42A60.18,60.18,0,0,0,181.21,180ZM228,97.94A36.23,36.23,0,0,1,206.06,76H228ZM49.94,76A36.23,36.23,0,0,1,28,97.94V76ZM28,158.06A36.23,36.23,0,0,1,49.94,180H28ZM206.06,180A36.23,36.23,0,0,1,228,158.06V180ZM128,88a40,40,0,1,0,40,40A40,40,0,0,0,128,88Zm0,56a16,16,0,1,1,16-16A16,16,0,0,1,128,144Z" />
    </svg>
  ),
};

const SUMMARY_BULLETS: { icon: keyof typeof featureIcons; messageId: TranslationKey }[] = [
  { icon: 'percent', messageId: 'flows.savingsFundOnboarding.termsStep.summary.fee' },
  { icon: 'globe', messageId: 'flows.savingsFundOnboarding.termsStep.summary.strategy' },
  { icon: 'money', messageId: 'flows.savingsFundOnboarding.termsStep.summary.withdrawals' },
];

export const TermsStep = <T extends SharedOnboardingFields = SharedOnboardingFields>({
  control,
  documents,
  showError,
  confirmTextId = 'flows.savingsFundOnboarding.termsStep.confirmText',
}: TermsStepProps<T>) => {
  const intl = useIntl();
  return (
    <section className="d-flex flex-column gap-4" key="conditions">
      <div className="d-flex flex-column gap-1">
        <h2 className="m-0">
          <FormattedMessage id="flows.savingsFundOnboarding.termsStep.title" />
        </h2>
      </div>
      <div className="section-content d-flex flex-column gap-5">
        <ul className="list-unstyled m-0 lead d-flex flex-column gap-3 px-3 px-sm-4">
          {SUMMARY_BULLETS.map(({ icon, messageId }) => (
            <li key={messageId} className="d-flex align-items-center gap-2">
              <span className="text-body d-inline-flex flex-shrink-0" style={{ width: '1.5rem' }}>
                {featureIcons[icon]}
              </span>
              <FormattedMessage id={messageId} />
            </li>
          ))}
        </ul>
        <div className="d-flex flex-column gap-3">
          {documents.map(({ href, labelId }) => (
            <DocumentLink key={href} href={href}>
              <FormattedMessage id={labelId} />
            </DocumentLink>
          ))}
        </div>
        <Controller
          control={control}
          name={'termsAccepted' as Path<T>}
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
                checked={field.value as boolean}
                onChange={field.onChange}
              />
              <label className="form-check-label w-100" htmlFor="terms-accepted">
                <FormattedMessage id={confirmTextId} />
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

const DocumentLink = ({ href, children }: { href: string; children: ReactNode }) => (
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
