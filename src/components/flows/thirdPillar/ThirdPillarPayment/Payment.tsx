import React, { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import ThirdPillarPaymentsAmount from '../../../account/statusBox/thirdPillarStatusBox/ThirdPillarContributionAmount';
import './Payment.scss';
import { redirectToPayment } from '../../../common/api';
import { PaymentChannel, PaymentType } from '../../../common/apiModels';
import { PaymentAmountInput } from './PaymentAmountInput';
import { OtherBankPaymentDetails } from './paymentDetails/OtherBankPaymentDetails';
import { useMe } from '../../../common/apiHooks';
import { AvailablePaymentType, BankKey } from './types';
import { PaymentTypeSelection } from './PaymentTypeSelection';
import { PaymentBankButtons } from './PaymentBankButtons';
import { RecurringPaymentDetails } from './RecurringPaymentDetails';
import { PaymentSubmitSection } from './PaymentSubmitSection';

export const Payment: React.FunctionComponent = () => {
  useIntl();

  const [paymentType, setPaymentType] = useState<AvailablePaymentType>(PaymentType.SINGLE);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentBank, setPaymentBank] = useState<BankKey | 'other' | null>(null);
  const [error, setError] = useState<boolean>(false);

  const { data: user } = useMe();

  if (!user) {
    return null;
  }

  const isSubmitDisabled = () =>
    !user.personalCode ||
    !paymentBank ||
    paymentBank === 'other' ||
    !paymentAmount ||
    Number(paymentAmount.replace(',', '.')) <= 0;

  const handleSubmit = async () => {
    setError(false);

    if (isSubmitDisabled()) {
      return;
    }

    try {
      await redirectToPayment({
        recipientPersonalCode: user.personalCode,
        amount: Number(paymentAmount.replace(',', '.')),
        currency: 'EUR',
        type: paymentType,
        paymentChannel: paymentBank?.toUpperCase() as PaymentChannel,
      });
    } catch (e) {
      setError(true);
    }
  };

  return (
    <>
      <h2 className="mt-3">
        <FormattedMessage id="thirdPillarPayment.title" />
      </h2>
      {error && (
        <div className="alert alert-danger mt-5" role="alert">
          <FormattedMessage id="thirdPillarPayment.errorGeneratingLink" />
        </div>
      )}
      <PaymentTypeSelection paymentType={paymentType} setPaymentType={setPaymentType} />
      <>
        <PaymentAmountInput
          paymentType={paymentType}
          value={paymentAmount}
          onChange={(event) => {
            const { value } = event.target;
            const euroRegex = /^\d+([.,]\d{0,2})?$/;

            if (value === '' || euroRegex.test(value)) {
              setPaymentAmount(value);
            }
          }}
          onWheel={(event) => event.currentTarget.blur()}
          className="mt-5"
        />

        <div className="payment-amount-input-footer">
          <ThirdPillarPaymentsAmount />
          <div>
            <small className="text-muted">
              <a href="//tuleva.ee/iii-sammas/" target="_blank" rel="noreferrer">
                {paymentType === PaymentType.SINGLE && (
                  <FormattedMessage id="thirdPillarPayment.singlePaymentHowMuch" />
                )}
                {paymentType === PaymentType.RECURRING && (
                  <FormattedMessage id="thirdPillarPayment.recurringPaymentHowMuch" />
                )}
              </a>
            </small>
          </div>
        </div>

        <div className="mt-5 payment-bank-title">
          <b>
            {paymentType === PaymentType.SINGLE && (
              <FormattedMessage id="thirdPillarPayment.singlePaymentBank" />
            )}
            {paymentType === PaymentType.RECURRING && (
              <FormattedMessage id="thirdPillarPayment.recurringPaymentBank" />
            )}
          </b>
        </div>

        <PaymentBankButtons paymentBank={paymentBank} setPaymentBank={setPaymentBank} />

        <div className="payment-details-container">
          {paymentType === PaymentType.RECURRING && paymentBank && (
            <RecurringPaymentDetails
              paymentBank={paymentBank}
              paymentAmount={paymentAmount}
              personalCode={user.personalCode}
            />
          )}
          {paymentType === PaymentType.SINGLE && paymentBank === 'other' && (
            <OtherBankPaymentDetails
              personalCode={user.personalCode}
              amount={paymentAmount}
              paymentType={PaymentType.SINGLE}
            />
          )}
          <PaymentSubmitSection
            paymentBank={paymentBank}
            paymentType={paymentType}
            handleSubmit={handleSubmit}
            disabled={isSubmitDisabled()}
          />
        </div>
      </>
    </>
  );
};
