import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import { PaymentDetailRow } from '../../thirdPillar/ThirdPillarPayment/paymentDetails/row/PaymentDetailRow';
import { PaymentAmountRow } from '../../thirdPillar/ThirdPillarPayment/paymentDetails/row/PaymentAmountRow';
import { CopyButton } from '../../../common/CopyButton';

const ACCOUNT_NAME = 'Tuleva Täiendav Kogumisfond';
const ACCOUNT_NUMBER = 'EE711010220306707220';

// The fund matches an incoming transfer by its description, so it has to be copied exactly.
export const GiftBankDetails: FC<{
  amount: number | undefined;
  paymentDescription: string;
  overMontonioLimit: boolean;
}> = ({ amount, paymentDescription, overMontonioLimit }) => (
  <div className="payment-details p-4">
    <h3>
      <FormattedMessage id="giftLink.bankTransfer.title" />
    </h3>
    <p className="text-body-secondary">
      <FormattedMessage
        id={
          overMontonioLimit
            ? 'giftLink.bankTransfer.whenOverLimit'
            : 'giftLink.bankTransfer.whenNoBank'
        }
      />
    </p>
    <div className="d-flex py-2">
      <span className="flex-shrink-0 tv-step__number me-3">
        <b>1</b>
      </span>
      <div className="flex-grow-1 align-self-center">
        <FormattedMessage id="giftLink.bankTransfer.step1" />
      </div>
    </div>
    <div className="d-flex py-2">
      <span className="flex-shrink-0 tv-step__number me-3">
        <b>2</b>
      </span>
      <div className="flex-grow-1 align-self-center">
        <FormattedMessage id="giftLink.bankTransfer.step2" />
        <div className="mt-3 p-3 p-md-4 payment-details-table">
          <PaymentDetailRow
            label={<FormattedMessage id="giftLink.bankTransfer.accountName" />}
            value={ACCOUNT_NAME}
            tooltip={<CopyButton textToCopy={ACCOUNT_NAME} />}
          />
          <PaymentDetailRow
            label={<FormattedMessage id="giftLink.bankTransfer.accountNumber" />}
            value={ACCOUNT_NUMBER}
            tooltip={<CopyButton textToCopy={ACCOUNT_NUMBER} />}
          />
          <PaymentDetailRow
            label={<FormattedMessage id="giftLink.bankTransfer.description" />}
            value={paymentDescription}
            tooltip={<CopyButton textToCopy={paymentDescription} />}
          />
          <PaymentAmountRow
            amount={amount?.toString() ?? ''}
            label={<FormattedMessage id="giftLink.bankTransfer.amount" />}
            tooltip={<CopyButton textToCopy={amount?.toFixed(2) ?? ''} />}
          />
        </div>
      </div>
    </div>
    <div className="d-flex py-2">
      <span className="flex-shrink-0 tv-step__number me-3">
        <b>3</b>
      </span>
      <div className="flex-grow-1 align-self-center">
        <FormattedMessage id="giftLink.bankTransfer.step3" />
      </div>
    </div>
    <p className="m-0 mt-3 text-body-secondary">
      <FormattedMessage id="giftLink.bankTransfer.copyExactly" />
    </p>
  </div>
);
