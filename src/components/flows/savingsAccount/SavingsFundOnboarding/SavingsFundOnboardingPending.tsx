import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import { StatusAlert } from '../../../common/statusAlert';
import { usePageTitle } from '../../../common/usePageTitle';

export const SavingsFundOnboardingPending: FC = () => {
  usePageTitle('savingsFund.onboarding.pending.pageTitle');

  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto">
      <StatusAlert
        type="pending"
        title={
          <h2 className="m-0">
            <FormattedMessage id="savingsFund.onboarding.pending.title" />
          </h2>
        }
        actions={
          <a href="/account" className="btn btn-outline-primary">
            <FormattedMessage id="savingsFund.onboarding.pending.myAccountButton.label" />
          </a>
        }
      >
        <p className="m-0">
          <FormattedMessage id="savingsFund.onboarding.pending.description" />
        </p>
      </StatusAlert>
    </div>
  );
};
