import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import { useLocation } from 'react-router-dom';
import { StatusAlert } from '../../../common/statusAlert';
import { usePageTitle } from '../../../common/usePageTitle';

type WaitingLocationState = { unverifiedNames?: string[] } | undefined;

export const SavingsFundOnboardingWaiting: FC = () => {
  usePageTitle('savingsFund.onboarding.waiting.pageTitle');
  const identityVerificationUrl = `${window.location.origin}/savings-fund/onboarding/identity`;

  // Only the submission knows who was outstanding, so a reload or a direct visit
  // arrives without them and the page stays count-neutral.
  const { state } = useLocation<WaitingLocationState>();
  const names = state?.unverifiedNames ?? [];

  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto">
      <StatusAlert
        type="pending"
        title={
          names.length > 0 ? (
            <FormattedMessage
              id="savingsFund.onboarding.waiting.title.named"
              values={{ count: names.length }}
            />
          ) : (
            <FormattedMessage id="savingsFund.onboarding.waiting.title" />
          )
        }
        actions={
          <a href="/account" className="btn btn-outline-primary">
            <FormattedMessage id="savingsFund.onboarding.waiting.accountButton.label" />
          </a>
        }
      >
        {names.length > 0 && (
          <p className="fw-bold m-0">
            <FormattedMessage
              id="savingsFund.onboarding.waiting.pending"
              values={{ names: names.join(', ') }}
            />
          </p>
        )}
        <p className="m-0">
          <FormattedMessage
            id="savingsFund.onboarding.waiting.description"
            values={{ count: names.length }}
          />
        </p>
        <a href={identityVerificationUrl} target="_blank" rel="noopener noreferrer">
          {identityVerificationUrl}
        </a>
      </StatusAlert>
    </div>
  );
};
