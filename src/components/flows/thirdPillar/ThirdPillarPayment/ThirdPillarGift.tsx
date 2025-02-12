import React, { useState } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import './Payment.scss';
import { captureException } from '@sentry/browser';
import { BankButton } from './BankButton';
import { redirectToPayment } from '../../../common/api';
import { PaymentChannel } from '../../../common/apiModels';
import { PaymentAmountInput } from './PaymentAmountInput';
import { OtherBankPaymentDetails } from './paymentDetails/OtherBankPaymentDetails';
import { isValidPersonalCode } from './PersonalCode';
import { BankKey } from './types';

export const ThirdPillarGift: React.FunctionComponent = () => {
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
    <>
      <h2 className="mt-3">
        <FormattedMessage id="thirdPillarPayment.giftTitle" />
      </h2>

      <p className="mt-3">
        <FormattedMessage
          id="thirdPillarPayment.giftDescription"
          values={{
            br: <br />,
          }}
        />
      </p>
      {error && (
        <div className="alert alert-danger mt-3" role="alert">
          <FormattedMessage id="thirdPillarPayment.errorGeneratingLink" />
        </div>
      )}

      <div>
        <label className="mt-3" htmlFor="payment-personal-code">
          <b>
            <b>
              <FormattedMessage id="thirdPillarPayment.giftRecipient" />
            </b>
          </b>
          <div className="d-flex align-items-center">
            <div className="input-group input-group-lg mt-2">
              <input
                id="payment-personal-code"
                type="number"
                placeholder={formatMessage({ id: 'login.id.code' })}
                min={0}
                className="form-control form-control-lg"
                value={paymentPersonalCode}
                onChange={(event) => setPaymentPersonalCode(event.target.value)}
                onWheel={(event) => event.currentTarget.blur()}
              />
            </div>
          </div>
        </label>
      </div>
      <div />

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
        className="mt-3"
      />
      <div />

      <div className="mt-3 payment-bank-title">
        <b>
          <FormattedMessage id="thirdPillarPayment.singlePaymentBank" />
        </b>
      </div>

      <div className="mt-2 payment-banks">
        {/* TODO use refactored PaymentBankButtons here */}
        <BankButton bankKey="swedbank" paymentBank={paymentBank} setPaymentBank={setPaymentBank} />
        <BankButton bankKey="seb" paymentBank={paymentBank} setPaymentBank={setPaymentBank} />
        <BankButton bankKey="lhv" paymentBank={paymentBank} setPaymentBank={setPaymentBank} />
        <BankButton bankKey="luminor" paymentBank={paymentBank} setPaymentBank={setPaymentBank} />
        <BankButton
          bankKey="other"
          paymentBank={paymentBank}
          setPaymentBank={setPaymentBank}
          disabled={!paymentPersonalCode || !isValidPersonalCode(paymentPersonalCode)}
        />
      </div>

      {paymentBank === 'other' &&
        paymentPersonalCode &&
        isValidPersonalCode(paymentPersonalCode) && (
          <OtherBankPaymentDetails
            personalCode={paymentPersonalCode}
            amount={paymentAmount}
            paymentType="SINGLE"
          />
        )}
      {paymentBank === 'other' && (
        <div className="mt-4">
          <Link to="/account">
            <button type="button" className="btn btn-light">
              <FormattedMessage id="thirdPillarPayment.backToAccountPage" />
            </button>
          </Link>
        </div>
      )}
      {paymentBank !== 'other' && (
        <>
          <div className="d-flex flex-wrap align-items-start">
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
    </>
  );
};

const mapStateToProps = () => ({});
export default connect(mapStateToProps)(ThirdPillarGift);
