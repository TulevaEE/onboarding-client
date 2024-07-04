import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import ThirdPillarPaymentsAmount from '../../../account/statusBox/thirdPillarStatusBox/ThirdPillarContributionAmount';
import './Payment.scss';
import { redirectToPayment } from '../../../common/api';
import { PaymentChannel, PaymentType } from '../../../common/apiModels';
import { PaymentAmountInput } from './PaymentAmountInput';
import { LuminorRecurringPaymentDetails } from './paymentDetails/LuminorRecurringPaymentDetails';
import { OtherBankPaymentDetails } from './paymentDetails/OtherBankPaymentDetails';
import { SwedbankRecurringPaymentDetails } from './paymentDetails/SwedbankRecurringPaymentDetails';
import { SebRecurringPaymentDetails } from './paymentDetails/SebRecurringPaymentDetails';
import { LhvRecurringPaymentDetails } from './paymentDetails/LhvRecurringPaymentDetails';
import { CoopRecurringPaymentDetails } from './paymentDetails/CoopRecurringPaymentDetails';
import { useMe } from '../../../common/apiHooks';
import { AvailablePaymentType, BankKey } from './types';
import { PaymentTypeSelection } from './PaymentTypeSelection';
import { PaymentBankButtons } from './PaymentBankButtons';

export const Payment: React.FunctionComponent = () => {
  useIntl();

  const [paymentType, setPaymentType] = useState<AvailablePaymentType>(PaymentType.SINGLE);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentBank, setPaymentBank] = useState<BankKey | 'other' | null>(null);

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

  return (
    <>
      <h2 className="mt-3">
        <FormattedMessage id="thirdPillarPayment.title" />
      </h2>
      <PaymentTypeSelection paymentType={paymentType} setPaymentType={setPaymentType} />
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

          <PaymentBankButtons paymentBank={paymentBank} setPaymentBank={setPaymentBank} />

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
                    personalCode={user.personalCode}
                  />
                )}

                {paymentBank === 'coop' && <CoopRecurringPaymentDetails />}

                {paymentBank === 'other' && (
                  <OtherBankPaymentDetails
                    personalCode={user.personalCode}
                    amount={paymentAmount}
                    paymentType={PaymentType.RECURRING}
                  />
                )}
              </>
            )}
            {paymentType === PaymentType.SINGLE && paymentBank === 'other' && (
              <OtherBankPaymentDetails
                personalCode={user.personalCode}
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
                      disabled={isSubmitDisabled()}
                      onClick={() => {
                        redirectToPayment({
                          recipientPersonalCode: user.personalCode,
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
                  {paymentType === PaymentType.RECURRING && !isSubmitDisabled() && (
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
    </>
  );
};
