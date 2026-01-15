import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import { usePageTitle } from '../../../common/usePageTitle';
import { StatusAlert } from '../../../common/statusAlert';
import { isSavingsFundWithdrawalEnabled } from '../../../common/featureFlags';

const SavingsFundPaymentSuccess: FC = () => {
  usePageTitle('savingsFund.payment.success.pageTitle');

  const descriptionKey = isSavingsFundWithdrawalEnabled()
    ? 'savingsFund.payment.success.description'
    : 'savingsFund.payment.success.description.initialOffer';

  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto d-flex flex-column gap-5">
      <StatusAlert
        title={<FormattedMessage id="savingsFund.payment.success.title" />}
        actions={
          <a href="/account" className="btn btn-outline-primary">
            <FormattedMessage id="common.myAccount" />
          </a>
        }
      >
        <p>
          <FormattedMessage id={descriptionKey} />
        </p>
      </StatusAlert>
    </div>
  );
};

export default SavingsFundPaymentSuccess;
