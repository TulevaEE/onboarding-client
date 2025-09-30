import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import { usePageTitle } from '../../../common/usePageTitle';
import { SuccessNotice2 } from '../../common/SuccessNotice2/SuccessNotice2';

const SavingsFundPaymentSuccess: FC = () => {
  usePageTitle('savingsFund.payment.success.pageTitle');

  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto d-flex flex-column gap-5">
      <SuccessNotice2>
        <h2 className="my-3">
          <FormattedMessage id="savingsFund.payment.success.title" />
        </h2>

        <p>
          <FormattedMessage id="savingsFund.payment.success.description" />
        </p>
        <p>
          <FormattedMessage id="savingsFund.payment.success.cancellationNotice" />
        </p>

        <a href="/account" className="btn btn-outline-primary">
          <FormattedMessage id="savingsFund.payment.success.myAccountButton.label" />
        </a>
      </SuccessNotice2>
    </div>
  );
};

export default SavingsFundPaymentSuccess;
