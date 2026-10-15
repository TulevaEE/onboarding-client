import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { SuccessNotice2 } from '../common/SuccessNotice2/SuccessNotice2';
import { PaymentDetailRow } from '../thirdPillar/ThirdPillarPayment/paymentDetails/row/PaymentDetailRow';
import { useMe } from '../../common/apiHooks';
import { ACCOUNT_PATH } from '../../paths';
import { TULEVA_3RD_PILLAR_FUND_ISIN } from '../../thirdPillar/initialState';
import '../thirdPillar/ThirdPillarPayment/Payment.scss';

const DetailsIfAsked = ({ pensionAccountNumber }: { pensionAccountNumber: string }) => (
  <div className="mt-4">
    <p className="mb-2">
      <FormattedMessage id="insuranceTransfer.done.ifAsked" />
    </p>
    <div className="p-3 p-md-4 payment-details-table">
      <PaymentDetailRow
        label={<FormattedMessage id="insuranceTransfer.done.isin" />}
        value={TULEVA_3RD_PILLAR_FUND_ISIN}
      />
      <PaymentDetailRow
        label={<FormattedMessage id="insuranceTransfer.done.pensionAccountNumber" />}
        value={pensionAccountNumber}
      />
    </div>
  </div>
);

export const InsuranceTransferDone = () => {
  const { data: user } = useMe();

  return (
    <>
      <SuccessNotice2 className="text-pretty">
        <h2 className="my-3">
          <FormattedMessage id="insuranceTransfer.done.title" />
        </h2>
        <p>
          <FormattedMessage id="insuranceTransfer.done.message" />
        </p>
        <Link className="btn btn-outline-primary mt-3" to={ACCOUNT_PATH}>
          <FormattedMessage id="thirdPillarSuccess.button.account" />
        </Link>
      </SuccessNotice2>
      {user?.pensionAccountNumber && (
        <DetailsIfAsked pensionAccountNumber={user.pensionAccountNumber} />
      )}
    </>
  );
};
