import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import { StatusAlert } from '../../../common/statusAlert';
import { usePageTitle } from '../../../common/usePageTitle';

type SavingsFundOnboardingSuccessProps = {
  company?: boolean;
};

export const SavingsFundOnboardingSuccess: FC<SavingsFundOnboardingSuccessProps> = ({
  company = false,
}) => {
  usePageTitle(
    company
      ? 'savingsFund.onboarding.success.company.pageTitle'
      : 'savingsFund.onboarding.success.pageTitle',
  );

  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto">
      <StatusAlert
        title={
          <FormattedMessage
            id={
              company
                ? 'savingsFund.onboarding.success.company.title'
                : 'savingsFund.onboarding.success.title'
            }
          />
        }
        actions={
          <>
            <a href="/savings-fund/payment" className="btn btn-primary">
              <FormattedMessage id="savingsFund.onboarding.success.primaryButton.label" />
            </a>
            <a href="/account" className="btn btn-outline-primary">
              <FormattedMessage id="savingsFund.onboarding.success.secondaryButton.label" />
            </a>
          </>
        }
      >
        <p>
          <FormattedMessage
            id={
              company
                ? 'savingsFund.onboarding.success.company.description'
                : 'savingsFund.onboarding.success.description'
            }
          />
        </p>
      </StatusAlert>
    </div>
  );
};
