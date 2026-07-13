import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import { StatusAlert } from '../../../common/statusAlert';
import { usePageTitle } from '../../../common/usePageTitle';
import { AccountHolder } from '../accountHolder';

type SavingsFundOnboardingSuccessProps = {
  accountHolder: AccountHolder;
};

const successDescriptionId = (accountHolder: AccountHolder) => {
  if (accountHolder === 'company') {
    return 'savingsFund.onboarding.success.company.description' as const;
  }
  if (accountHolder === 'child') {
    return 'savingsFund.onboarding.success.child.description' as const;
  }
  return 'savingsFund.onboarding.success.description' as const;
};

export const SavingsFundOnboardingSuccess: FC<SavingsFundOnboardingSuccessProps> = ({
  accountHolder,
}) => {
  const company = accountHolder === 'company';
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
          <FormattedMessage id={successDescriptionId(accountHolder)} />
        </p>
      </StatusAlert>
    </div>
  );
};
