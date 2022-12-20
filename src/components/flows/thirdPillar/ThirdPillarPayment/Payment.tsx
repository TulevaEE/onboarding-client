import React, { useState } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import { Radio } from '../../../common';
import ThirdPillarPaymentsThisYear from '../../../account/statusBox/thirdPillarStatusBox/ThirdPillarYearToDateContribution';
import './ThirdPillarPayment.scss';
import { BankButton } from './BankButton';
import { State } from '../../../../types';
import { redirectToPayment } from '../../../common/api';
import { Bank, PaymentType } from '../../../common/apiModels';
import { PaymentAmountInput } from './PaymentAmountInput';
import { LuminorRecurringPaymentDetails } from './paymentDetails/LuminorRecurringPaymentDetails';
import { OtherBankPaymentDetails } from './paymentDetails/OtherBankPaymentDetails';
import { SwedbankRecurringPaymentDetails } from './paymentDetails/SwedbankRecurringPaymentDetails';
import { SebRecurringPaymentDetails } from './paymentDetails/SebRecurringPaymentDetails';
import { LhvRecurringPaymentDetails } from './paymentDetails/LhvRecurringPaymentDetails';

export const Payment: React.FunctionComponent<{
  pensionAccountNumber: string;
  token: string;
}> = ({ pensionAccountNumber, token }) => {
  const { formatMessage } = useIntl();

  const [paymentType, setPaymentType] = useState<PaymentType>(PaymentType.SINGLE);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentBank, setPaymentBank] = useState<string>('');

  const isDisabled = () =>
    !paymentBank || paymentBank === 'other' || !paymentAmount || Number(paymentAmount) <= 0;

  return (
    <>
      <h2 className="mt-3">
        <FormattedMessage id="thirdPillarPayment.title" />
      </h2>

      <div className="mt-5">
        <b>
          <FormattedMessage id="thirdPillarPayment.paymentType" />
        </b>
      </div>

      <Radio
        name="payment-type"
        id="payment-type-single"
        className="mt-3 p-3"
        selected={paymentType === PaymentType.SINGLE}
        onSelect={() => {
          setPaymentType(PaymentType.SINGLE);
        }}
      >
        <p className="m-0">
          <FormattedMessage id="thirdPillarPayment.singlePayment" />
        </p>
      </Radio>

      <Radio
        name="payment-type"
        id="payment-type-recurring"
        className="mt-3"
        selected={paymentType === PaymentType.RECURRING}
        onSelect={() => {
          setPaymentType(PaymentType.RECURRING);
        }}
      >
        <p className="m-0">
          <FormattedMessage id="thirdPillarPayment.recurringPayment" />
        </p>
      </Radio>

      <PaymentAmountInput
        paymentType={paymentType}
        value={paymentAmount}
        onChange={(event) => setPaymentAmount(event.target.value)}
        onWheel={(event) => event.currentTarget.blur()}
      />

      <div className="mt-2 payment-amount-input-footer">
        <ThirdPillarPaymentsThisYear />
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

      <div className="mt-2 payment-banks">
        <BankButton
          bankKey="swedbank"
          bankName="Swedbank"
          paymentBank={paymentBank}
          setPaymentBank={setPaymentBank}
        />
        <BankButton
          bankKey="seb"
          bankName="SEB"
          paymentBank={paymentBank}
          setPaymentBank={setPaymentBank}
        />
        <BankButton
          bankKey="lhv"
          bankName="LHV"
          paymentBank={paymentBank}
          setPaymentBank={setPaymentBank}
        />
        <BankButton
          bankKey="luminor"
          bankName="Luminor"
          paymentBank={paymentBank}
          setPaymentBank={setPaymentBank}
        />
        <BankButton
          bankKey="other"
          bankName={formatMessage({ id: 'thirdPillarPayment.otherBank' })}
          paymentBank={paymentBank}
          setPaymentBank={setPaymentBank}
        />
      </div>

      {paymentType === PaymentType.RECURRING && paymentBank && (
        <>
          {paymentBank === 'swedbank' && <SwedbankRecurringPaymentDetails amount={paymentAmount} />}

          {paymentBank === 'seb' && <SebRecurringPaymentDetails />}

          {paymentBank === 'lhv' && <LhvRecurringPaymentDetails />}

          {paymentBank === 'luminor' && (
            <LuminorRecurringPaymentDetails
              amount={paymentAmount}
              pensionAccountNumber={pensionAccountNumber}
            />
          )}

          {paymentBank === 'other' && (
            <OtherBankPaymentDetails
              pensionAccountNumber={pensionAccountNumber}
              amount={paymentAmount}
              paymentType={PaymentType.RECURRING}
            />
          )}
        </>
      )}
      {paymentType === PaymentType.SINGLE && paymentBank === 'other' && (
        <OtherBankPaymentDetails
          pensionAccountNumber={pensionAccountNumber}
          amount={paymentAmount}
          paymentType={PaymentType.SINGLE}
        />
      )}
      {paymentBank === 'other' && (
        <div className="mt-4 yes-button">
          <p>
            {paymentType === PaymentType.RECURRING ? (
              <FormattedMessage id="thirdPillarPayment.recurringPaymentQuestion" />
            ) : (
              <FormattedMessage id="thirdPillarPayment.paymentQuestion" />
            )}
          </p>

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
                  redirectToPayment(
                    {
                      amount: Number(paymentAmount),
                      currency: 'EUR',
                      type: paymentType,
                      bank: paymentBank.toUpperCase() as Bank,
                    },
                    token,
                  );
                }}
              >
                {paymentType === PaymentType.SINGLE && (
                  <FormattedMessage id="thirdPillarPayment.makePayment" />
                )}
                {paymentType === PaymentType.RECURRING && (
                  <FormattedMessage id="thirdPillarPayment.setupRecurringPayment" />
                )}
              </button>
              <div className="mt-2">
                <small className="text-muted">
                  {paymentType === PaymentType.SINGLE && (
                    <FormattedMessage
                      id="thirdPillarPayment.freeSinglePayment"
                      values={{
                        b: (chunks: string) => <b>{chunks}</b>,
                      }}
                    />
                  )}
                  {paymentType === PaymentType.RECURRING && (
                    <FormattedMessage
                      id="thirdPillarPayment.freeRecurringPayment"
                      values={{
                        b: (chunks: string) => <b>{chunks}</b>,
                      }}
                    />
                  )}
                </small>
              </div>
            </div>
            {paymentType === PaymentType.RECURRING && !isDisabled() && (
              <div className="d-flex flex-wrap align-items-center">
                <span className="mr-2 mt-4">
                  <FormattedMessage id="thirdPillarPayment.recurringPaymentQuestion" />
                </span>
                <Link to="/account">
                  <button type="button" className="btn btn-light text-nowrap mt-4">
                    <FormattedMessage id="thirdPillarPayment.backToAccountPage" />
                  </button>
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};

const mapStateToProps = (state: State) => ({
  pensionAccountNumber: state.login.user && state.login.user.pensionAccountNumber,
  token: state.login.token,
});
export default connect(mapStateToProps)(Payment);
