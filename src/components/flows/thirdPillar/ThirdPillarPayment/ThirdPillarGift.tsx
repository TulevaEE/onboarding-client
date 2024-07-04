import React, { useState } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import './Payment.scss';
import { BankButton } from './BankButton';
import { redirectToPayment } from '../../../common/api';
import { PaymentChannel, PaymentType } from '../../../common/apiModels';
import { PaymentAmountInput } from './PaymentAmountInput';
import { OtherBankPaymentDetails } from './paymentDetails/OtherBankPaymentDetails';
import { isValidPersonalCode } from './PersonalCode';
import { BankKey } from './types';

export const ThirdPillarGift: React.FunctionComponent = () => {
  const { formatMessage } = useIntl();

  const [paymentPersonalCode, setPaymentPersonalCode] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentBank, setPaymentBank] = useState<BankKey | 'other' | null>(null);

  const isDisabled = () =>
    !paymentPersonalCode ||
    !isValidPersonalCode(paymentPersonalCode) ||
    !paymentBank ||
    paymentBank === 'other' ||
    !paymentAmount ||
    Number(paymentAmount.replace(',', '.')) <= 0;

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

      <div>
        <label className="mt-3" htmlFor="payment-personal-code">
          <b>
            <b>
              <FormattedMessage id="thirdPillarPayment.giftRecipient" />
            </b>
          </b>
          <div className="form-inline">
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
        paymentType={PaymentType.GIFT}
        value={paymentAmount}
        onChange={(event) => {
          const { value } = event.target;
          const euroRegex = /^\d+([.,]\d{0,2})?$/;

          if (value === '' || euroRegex.test(value)) {
            setPaymentAmount(value);
          }
        }}
        onWheel={(event) => event.currentTarget.blur()}
        className="mt-3"
      />
      <div />

      <div className="mt-3 payment-bank-title">
        <b>
          <FormattedMessage id="thirdPillarPayment.singlePaymentBank" />
        </b>
      </div>

      <div className="mt-2 payment-banks">
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
            paymentType={PaymentType.SINGLE}
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
            <div className="mr-auto">
              <button
                type="button"
                className="btn btn-primary payment-button text-nowrap mt-4"
                disabled={isDisabled()}
                onClick={() => {
                  redirectToPayment({
                    recipientPersonalCode: paymentPersonalCode,
                    amount: Number(paymentAmount.replace(',', '.')),
                    currency: 'EUR',
                    type: PaymentType.GIFT,
                    paymentChannel: paymentBank?.toUpperCase() as PaymentChannel,
                  });
                }}
              >
                <FormattedMessage id="thirdPillarPayment.makePayment" />
              </button>
              <div className="mt-2">
                <small className="text-muted">
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
