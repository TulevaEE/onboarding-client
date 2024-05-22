import React, { useState } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import { Radio } from '../../../common';
import ThirdPillarPaymentsAmount from '../../../account/statusBox/thirdPillarStatusBox/ThirdPillarContributionAmount';
import './Payment.scss';
import { BankButton } from './BankButton';
import { State } from '../../../../types';
import { redirectToPayment } from '../../../common/api';
import { PaymentChannel, PaymentType } from '../../../common/apiModels';
import { PaymentAmountInput } from './PaymentAmountInput';
import { LuminorRecurringPaymentDetails } from './paymentDetails/LuminorRecurringPaymentDetails';
import { OtherBankPaymentDetails } from './paymentDetails/OtherBankPaymentDetails';
import { SwedbankRecurringPaymentDetails } from './paymentDetails/SwedbankRecurringPaymentDetails';
import { SebRecurringPaymentDetails } from './paymentDetails/SebRecurringPaymentDetails';
import { LhvRecurringPaymentDetails } from './paymentDetails/LhvRecurringPaymentDetails';
import { CoopRecurringPaymentDetails } from './paymentDetails/CoopRecurringPaymentDetails';
import { EmployerPaymentDetails } from './paymentDetails/EmployerPaymentDetails';

export const Payment: React.FunctionComponent<{
  personalCode: string;
}> = ({ personalCode }) => {
  const { formatMessage } = useIntl();

  const [paymentType, setPaymentType] = useState<PaymentType>(PaymentType.SINGLE);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentBank, setPaymentBank] = useState<string>('');

  const isDisabled = () =>
    !personalCode ||
    !paymentBank ||
    paymentBank === 'other' ||
    !paymentAmount ||
    Number(paymentAmount.replace(',', '.')) <= 0;

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
          <FormattedMessage id="thirdPillarPayment.SINGLE" />
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
          <FormattedMessage id="thirdPillarPayment.RECURRING" />
        </p>
      </Radio>
      {false && (
        <Radio
          name="payment-type"
          id="payment-type-employer"
          className="mt-3"
          selected={paymentType === PaymentType.EMPLOYER}
          onSelect={() => {
            setPaymentType(PaymentType.EMPLOYER);
          }}
        >
          <p className="m-0">
            <FormattedMessage id="thirdPillarPayment.EMPLOYER" />
          </p>
        </Radio>
      )}
      {(paymentType === PaymentType.SINGLE || paymentType === PaymentType.RECURRING) && (
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
              bankKey="coop"
              bankName="Coop Pank"
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

          <div className="payment-details-container">
            {paymentType === PaymentType.RECURRING && paymentBank && (
              <>
                {paymentBank === 'swedbank' && (
                  <SwedbankRecurringPaymentDetails amount={paymentAmount} />
                )}

                {paymentBank === 'seb' && <SebRecurringPaymentDetails />}

                {paymentBank === 'lhv' && <LhvRecurringPaymentDetails />}

                {paymentBank === 'luminor' && (
                  <LuminorRecurringPaymentDetails
                    amount={paymentAmount}
                    personalCode={personalCode}
                  />
                )}

                {paymentBank === 'coop' && <CoopRecurringPaymentDetails />}

                {paymentBank === 'other' && (
                  <OtherBankPaymentDetails
                    personalCode={personalCode}
                    amount={paymentAmount}
                    paymentType={PaymentType.RECURRING}
                  />
                )}
              </>
            )}
            {paymentType === PaymentType.SINGLE && paymentBank === 'other' && (
              <OtherBankPaymentDetails
                personalCode={personalCode}
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
                          recipientPersonalCode: personalCode,
                          amount: Number(paymentAmount.replace(',', '.')),
                          currency: 'EUR',
                          type: paymentType,
                          paymentChannel: paymentBank.toUpperCase() as PaymentChannel,
                        });
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
                      <a className="btn btn-light text-nowrap mt-4" href="/account">
                        <FormattedMessage id="thirdPillarPayment.backToAccountPage" />
                      </a>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </>
      )}
      {paymentType === PaymentType.EMPLOYER && (
        <>
          <EmployerPaymentDetails />
          <a className="btn btn-light text-nowrap mt-4" href="/account">
            <FormattedMessage id="thirdPillarPayment.backToAccountPage" />
          </a>
        </>
      )}
    </>
  );
};

const mapStateToProps = (state: State) => ({
  personalCode: state.login.user && state.login.user.personalCode,
});
export default connect(mapStateToProps)(Payment);
