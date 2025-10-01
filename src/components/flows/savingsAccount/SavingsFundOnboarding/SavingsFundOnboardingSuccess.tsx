import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import { StatusAlert } from '../../../common/statusAlert';
import { usePageTitle } from '../../../common/usePageTitle';

export const SavingsFundOnboardingSuccess: FC = () => {
  usePageTitle('savingsFund.onboarding.success.pageTitle');

  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto">
      <StatusAlert
        title={<FormattedMessage id="savingsFund.onboarding.success.title" />}
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
          <FormattedMessage id="savingsFund.onboarding.success.description" />
        </p>
      </StatusAlert>
    </div>
  );
};
