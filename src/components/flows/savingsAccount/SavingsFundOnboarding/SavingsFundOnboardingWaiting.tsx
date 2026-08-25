import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import { StatusAlert } from '../../../common/statusAlert';
import { usePageTitle } from '../../../common/usePageTitle';

export const SavingsFundOnboardingWaiting: FC = () => {
  usePageTitle('savingsFund.onboarding.waiting.pageTitle');

  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto">
      <StatusAlert
        type="pending"
        title={<FormattedMessage id="savingsFund.onboarding.waiting.title" />}
        actions={
          <a href="/account" className="btn btn-outline-primary">
            <FormattedMessage id="savingsFund.onboarding.waiting.accountButton.label" />
          </a>
        }
      >
        <p>
          <FormattedMessage id="savingsFund.onboarding.waiting.description" />
        </p>
      </StatusAlert>
    </div>
  );
};
