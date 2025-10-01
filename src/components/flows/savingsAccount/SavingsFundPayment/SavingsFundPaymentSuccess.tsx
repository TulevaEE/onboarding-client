import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import { usePageTitle } from '../../../common/usePageTitle';
import { StatusAlert } from '../../../common/statusAlert';

const SavingsFundPaymentSuccess: FC = () => {
  usePageTitle('savingsFund.payment.success.pageTitle');

  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto d-flex flex-column gap-5">
      <StatusAlert
        title={<FormattedMessage id="savingsFund.payment.success.title" />}
        actions={
          <a href="/account" className="btn btn-outline-primary">
            <FormattedMessage id="savingsFund.payment.success.myAccountButton.label" />
          </a>
        }
      >
        <p>
          <FormattedMessage id="savingsFund.payment.success.description" />
        </p>
      </StatusAlert>
    </div>
  );
};

export default SavingsFundPaymentSuccess;
