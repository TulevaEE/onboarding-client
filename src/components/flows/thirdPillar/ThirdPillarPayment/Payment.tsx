import React, { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { captureException } from '@sentry/browser';
import ThirdPillarPaymentsAmount from '../../../account/statusBox/thirdPillarStatusBox/ThirdPillarContributionAmount';
import './Payment.scss';
import { redirectToPayment } from '../../../common/api';
import { PaymentChannel } from '../../../common/apiModels';
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

  const [paymentType, setPaymentType] = useState<AvailablePaymentType>('SINGLE');
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
      captureException(e);
    }
  };

  return (
    <div className="col-12 col-md-11 col-lg-8 mx-auto">
      <h1 className="mb-3">
        <FormattedMessage id="thirdPillarPayment.title" />
      </h1>
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
          max={6000}
          className="mt-5 form-label fw-bold"
        />

        <div className="payment-amount-input-footer mt-3 text-body-secondary">
          <ThirdPillarPaymentsAmount />
          <div>
            <a href="//tuleva.ee/iii-sammas/" target="_blank" rel="noreferrer">
              {paymentType === 'SINGLE' && (
                <FormattedMessage id="thirdPillarPayment.singlePaymentHowMuch" />
              )}
              {paymentType === 'RECURRING' && (
                <FormattedMessage id="thirdPillarPayment.recurringPaymentHowMuch" />
              )}
            </a>
          </div>
        </div>

        <p className="mt-5 mb-2 fw-bold">
          {paymentType === 'SINGLE' && (
            <FormattedMessage id="thirdPillarPayment.singlePaymentBank" />
          )}
          {paymentType === 'RECURRING' && (
            <FormattedMessage id="thirdPillarPayment.recurringPaymentBank" />
          )}
        </p>

        <PaymentBankButtons paymentBank={paymentBank} setPaymentBank={setPaymentBank} />

        <div className="payment-details-container mt-5">
          {paymentType === 'RECURRING' && paymentBank && (
            <RecurringPaymentDetails
              paymentBank={paymentBank}
              paymentAmount={paymentAmount}
              personalCode={user.personalCode}
            />
          )}
          {paymentType === 'SINGLE' && paymentBank === 'other' && (
            <OtherBankPaymentDetails
              personalCode={user.personalCode}
              amount={paymentAmount}
              paymentType="SINGLE"
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
    </div>
  );
};
