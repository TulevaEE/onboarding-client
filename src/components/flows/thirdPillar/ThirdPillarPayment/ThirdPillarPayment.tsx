import React, { useState } from 'react';
import { connect } from 'react-redux';
import { Link, Redirect } from 'react-router-dom';
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

export const ThirdPillarPayment: React.FunctionComponent<{
  previousPath: string;
  nextPath: string;
  signedMandateId: number;
  pensionAccountNumber: string;
  isUserConverted: boolean;
  token: string;
}> = ({
  previousPath,
  nextPath,
  signedMandateId,
  pensionAccountNumber,
  isUserConverted,
  token,
}) => {
  const { formatMessage } = useIntl();

  const [paymentType, setPaymentType] = useState<PaymentType>(PaymentType.SINGLE);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentBank, setPaymentBank] = useState<string>('');

  return (
    <>
      {!signedMandateId && !isUserConverted && <Redirect to={previousPath} />}

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
            <a
              href="//tuleva.ee/vastused/kolmanda-samba-kysimused/"
              target="_blank"
              rel="noreferrer"
            >
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
        <div className="mt-4 recurring-payment-details">
          <p>
            <FormattedMessage
              id={`thirdPillarPayment.recurringPaymentDescription.${paymentBank}`}
              values={{
                b: (chunks: string) => <b>{chunks}</b>,
                br: <br />,
              }}
            />
          </p>

          {/* {paymentBank === 'swedbank' && <SwedbankRecurringPaymentDetails amount={paymentAmount} />} */}

          {/* {paymentBank === 'seb' && ( */}
          {/*  <SebRecurringPaymentDetails */}
          {/*    amount={paymentAmount} */}
          {/*    pensionAccountNumber={pensionAccountNumber} */}
          {/*  /> */}
          {/* )} */}

          {/* {paymentBank === 'lhv' && ( */}
          {/*  <LhvRecurringPaymentDetails */}
          {/*    amount={paymentAmount} */}
          {/*    pensionAccountNumber={pensionAccountNumber} */}
          {/*  /> */}
          {/* )} */}

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
            />
          )}
        </div>
      )}
      {paymentType === PaymentType.SINGLE && paymentBank === 'other' && (
        <div className="mt-4 other-bank-payment-details">
          <p>
            <FormattedMessage
              id="thirdPillarPayment.singlePaymentDescription"
              values={{ b: (chunks: string) => <b>{chunks}</b> }}
            />
          </p>
          <OtherBankPaymentDetails
            pensionAccountNumber={pensionAccountNumber}
            amount={paymentAmount}
          />
        </div>
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

          <Link to={nextPath}>
            <button type="button" className="btn btn-primary">
              <FormattedMessage id="thirdPillarPayment.yesButton" />
            </button>
          </Link>
        </div>
      )}
      {paymentBank !== 'other' && (
        <div className="mt-4 payment-button">
          <button
            type="button"
            className="btn btn-primary"
            disabled={
              !paymentBank ||
              paymentBank === 'other' ||
              !paymentAmount ||
              Number(paymentAmount) <= 0
            }
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
      )}
    </>
  );
};

const mapStateToProps = (state: State) => ({
  signedMandateId: state.thirdPillar.signedMandateId,
  pensionAccountNumber: state.login.user && state.login.user.pensionAccountNumber,
  isUserConverted:
    state.thirdPillar.exchangeableSourceFunds &&
    !state.thirdPillar.exchangeableSourceFunds.length &&
    state.login.userConversion &&
    state.login.userConversion.thirdPillar.selectionComplete,
  token: state.login.token,
});
export default connect(mapStateToProps)(ThirdPillarPayment);
