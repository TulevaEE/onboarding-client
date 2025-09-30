import React, { useState } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage, useIntl } from 'react-intl';
import './Payment.scss';
import { Link } from 'react-router-dom';
import { captureException } from '@sentry/browser';
import { redirectToPayment } from '../../../common/api';
import { PaymentChannel } from '../../../common/apiModels';
import { usePageTitle } from '../../../common/usePageTitle';
import { PaymentAmountInput } from './PaymentAmountInput';
import { OtherBankPaymentDetails } from './paymentDetails/OtherBankPaymentDetails';
import { isValidPersonalCode } from './PersonalCode';
import { BankKey } from './types';
import { PaymentBankButtons } from './PaymentBankButtons';

export const ThirdPillarGift: React.FunctionComponent = () => {
  usePageTitle('pageTitle.thirdPillarGift');

  const { formatMessage } = useIntl();

  const [paymentPersonalCode, setPaymentPersonalCode] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentBank, setPaymentBank] = useState<BankKey | 'other' | null>(null);
  const [error, setError] = useState<boolean>(false);

  const isSubmitDisabled = () =>
    !paymentPersonalCode ||
    !isValidPersonalCode(paymentPersonalCode) ||
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
        recipientPersonalCode: paymentPersonalCode,
        amount: Number(paymentAmount.replace(',', '.')),
        currency: 'EUR',
        type: 'GIFT',
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
        <FormattedMessage id="thirdPillarPayment.giftTitle" />
      </h1>
      <p className="mt-3 lead">
        <FormattedMessage id="thirdPillarPayment.giftDescription" />
      </p>
      {error && (
        <div className="alert alert-danger mt-3" role="alert">
          <FormattedMessage id="thirdPillarPayment.errorGeneratingLink" />
        </div>
      )}
      <div className="mt-5">
        <label className="mb-2 fw-bold" htmlFor="payment-personal-code">
          <FormattedMessage id="thirdPillarPayment.giftRecipient" />
        </label>
        <input
          id="payment-personal-code"
          type="text"
          maxLength={11}
          inputMode="numeric"
          placeholder={formatMessage({ id: 'login.id.code' })}
          min={0}
          className="form-control form-control-lg w-50"
          value={paymentPersonalCode}
          onChange={(event) => setPaymentPersonalCode(event.target.value)}
          onWheel={(event) => event.currentTarget.blur()}
        />
      </div>
      <div className="mt-4">
        <PaymentAmountInput
          paymentType="GIFT"
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
          className="mb-2 fw-bold"
        />
      </div>
      <p className="mt-4 mb-2 fw-bold">
        <FormattedMessage id="thirdPillarPayment.singlePaymentBank" />
      </p>
      <PaymentBankButtons paymentBank={paymentBank} setPaymentBank={setPaymentBank} />
      {paymentBank === 'other' &&
        paymentPersonalCode &&
        isValidPersonalCode(paymentPersonalCode) && (
          <>
            <OtherBankPaymentDetails
              personalCode={paymentPersonalCode}
              amount={paymentAmount}
              paymentType="SINGLE"
            />
            <div className="mt-5 d-flex gap-2 align-items-center">
              <span>
                <FormattedMessage id="thirdPillarPayment.paymentQuestion" />
              </span>
              <Link className="icon-link" to="/account">
                <FormattedMessage id="thirdPillarPayment.backToAccountPage" />
              </Link>
            </div>
          </>
        )}
      {paymentBank !== 'other' && (
        <>
          <div className="mt-5 d-flex flex-column">
            <div className="me-auto">
              <button
                type="button"
                className="btn btn-lg btn-primary payment-button text-nowrap"
                disabled={isSubmitDisabled()}
                onClick={handleSubmit}
              >
                <FormattedMessage id="thirdPillarPayment.makePayment" />
              </button>
              <div className="mt-2">
                <small className="text-body-secondary">
                  <FormattedMessage
                    id="thirdPillarPayment.freeSinglePayment"
                    values={{
                      b: (chunks: string) => <b>{chunks}</b>,
                    }}
                  />
                </small>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const mapStateToProps = () => ({});
export default connect(mapStateToProps)(ThirdPillarGift);
