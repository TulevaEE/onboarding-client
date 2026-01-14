import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import { PaymentDetailRow } from '../../thirdPillar/ThirdPillarPayment/paymentDetails/row/PaymentDetailRow';
import { PaymentAmountRow } from '../../thirdPillar/ThirdPillarPayment/paymentDetails/row/PaymentAmountRow';
import { TranslationKey } from '../../../translations';

const ACCOUNT_NAME = 'Tuleva Täiendav Kogumisfond';
const ACCOUNT_NUMBER = 'EE711010220306707220';

export const SavingsFundOtherBankDetails: FC<{
  amount: number | undefined;
  personalCode: string;
  titleId?: TranslationKey;
}> = ({ amount, personalCode, titleId = 'savingsFund.payment.otherBank.title' }) => (
  <div className="payment-details p-4">
    <h3>
      <FormattedMessage id={titleId} />
    </h3>
    <div className="d-flex py-2">
      <span className="flex-shrink-0 tv-step__number me-3">
        <b>1</b>
      </span>
      <div className="flex-grow-1 align-self-center">
        <FormattedMessage id="savingsFund.payment.otherBank.step1" />
      </div>
    </div>
    <div className="d-flex py-2">
      <span className="flex-shrink-0 tv-step__number me-3">
        <b>2</b>
      </span>
      <div className="flex-grow-1 align-self-center">
        <FormattedMessage id="savingsFund.payment.otherBank.step2" />
        <div className="mt-3 p-4 payment-details-table">
          <PaymentDetailRow
            label={<FormattedMessage id="savingsFund.payment.otherBank.accountName" />}
            value={ACCOUNT_NAME}
            labelCol={5}
            valueCol={7}
          />
          <PaymentDetailRow
            label={<FormattedMessage id="savingsFund.payment.otherBank.accountNumber" />}
            value={ACCOUNT_NUMBER}
            labelCol={5}
            valueCol={7}
          />
          <PaymentDetailRow
            label={<FormattedMessage id="savingsFund.payment.otherBank.paymentDescription" />}
            value={personalCode}
            labelCol={5}
            valueCol={7}
          />
          <PaymentAmountRow
            amount={amount?.toString() ?? ''}
            label={<FormattedMessage id="savingsFund.payment.otherBank.amount" />}
            labelCol={5}
            valueCol={7}
          />
        </div>
      </div>
    </div>
    <div className="d-flex py-2">
      <span className="flex-shrink-0 tv-step__number me-3">
        <b>3</b>
      </span>
      <div className="flex-grow-1 align-self-center">
        <FormattedMessage id="savingsFund.payment.otherBank.step3" />
      </div>
    </div>
  </div>
);
