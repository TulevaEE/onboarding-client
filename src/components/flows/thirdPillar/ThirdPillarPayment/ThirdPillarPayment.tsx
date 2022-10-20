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
import InfoTooltip from '../../../common/infoTooltip';

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

      <div>
        <label className="mt-5" htmlFor="payment-amount">
          <b>
            {paymentType === PaymentType.SINGLE && (
              <FormattedMessage id="thirdPillarPayment.singlePaymentAmount" />
            )}
            {paymentType === PaymentType.RECURRING && (
              <FormattedMessage id="thirdPillarPayment.recurringPaymentAmount" />
            )}
          </b>
          <div className="form-inline">
            <div className="input-group input-group-lg mt-2">
              <input
                id="payment-amount"
                type="number"
                placeholder={paymentType === PaymentType.SINGLE ? '6000' : '500'}
                className="form-control form-control-lg"
                min="0.00"
                step="0.01"
                value={paymentAmount}
                onChange={(event) => setPaymentAmount(event.target.value)}
                onWheel={(event) => event.currentTarget.blur()}
              />
              <div className="input-group-append">
                <span className="input-group-text">
                  &euro;
                  {paymentType === PaymentType.RECURRING && (
                    <FormattedMessage id="thirdPillarPayment.perMonth" />
                  )}
                </span>
              </div>
            </div>
          </div>
        </label>

        <div className="mt-2">
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

        <div className="mt-5">
          <b>
            {paymentType === PaymentType.SINGLE && (
              <FormattedMessage id="thirdPillarPayment.singlePaymentBank" />
            )}
            {paymentType === PaymentType.RECURRING && (
              <FormattedMessage id="thirdPillarPayment.recurringPaymentBank" />
            )}
          </b>
        </div>

        <div className="mt-2">
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
      </div>

      {(paymentType === PaymentType.RECURRING || paymentBank === 'other') && paymentBank && (
        <div className="mt-4">
          <p>
            {paymentType === PaymentType.RECURRING ? (
              <FormattedMessage
                id={`thirdPillarPayment.recurringPaymentDescription.${paymentBank}`}
                values={{ b: (chunks: string) => <b>{chunks}</b> }}
              />
            ) : (
              <FormattedMessage
                id="thirdPillarPayment.singlePaymentDescription"
                values={{ b: (chunks: string) => <b>{chunks}</b> }}
              />
            )}
          </p>

          <table>
            <tbody>
              <tr>
                <td className="text-nowrap">
                  <FormattedMessage id="thirdPillarPayment.accountName" />
                  :&nbsp;
                </td>
                <td className="pl-2">
                  <b>AS Pensionikeskus</b>
                </td>
                <td className="pl-2 d-none d-sm-block">
                  <InfoTooltip name="third-pillar-payment-account-name">
                    <FormattedMessage id="thirdPillarPayment.pensionRegistry" />
                  </InfoTooltip>
                </td>
              </tr>
              <tr>
                <td className="align-top">
                  <FormattedMessage id="thirdPillarPayment.accountNumber" />
                  :&nbsp;
                </td>
                {paymentBank === 'swedbank' || paymentBank === 'other' ? (
                  <>
                    <td className="pl-2">
                      <b>EE362200221067235244</b>
                    </td>
                    <td className="pl-2 d-none d-sm-block">
                      <InfoTooltip name="third-pillar-payment-bank-swedbank">
                        <FormattedMessage id="thirdPillarPayment.accountNumberSwedbank" />
                      </InfoTooltip>
                    </td>
                  </>
                ) : null}
                {paymentBank === 'seb' ? (
                  <>
                    <td className="pl-2">
                      <b>EE141010220263146225</b>
                    </td>
                    <td className="pl-2 d-none d-sm-block">
                      <InfoTooltip name="third-pillar-payment-bank-seb">
                        <FormattedMessage id="thirdPillarPayment.accountNumberSeb" />
                      </InfoTooltip>
                    </td>
                  </>
                ) : null}
                {paymentBank === 'lhv' ? (
                  <>
                    <td className="pl-2">
                      <b>EE547700771002908125</b>
                    </td>
                    <td className="pl-2 d-none d-sm-block">
                      <InfoTooltip name="third-pillar-payment-bank-lhv">
                        <FormattedMessage id="thirdPillarPayment.accountNumberLhv" />
                      </InfoTooltip>
                    </td>
                  </>
                ) : null}
                {paymentBank === 'luminor' ? (
                  <>
                    <td className="pl-2">
                      <b>EE961700017004379157</b>
                    </td>
                    <td className="pl-2 d-none d-sm-block">
                      <InfoTooltip name="third-pillar-payment-bank-luminor">
                        <FormattedMessage id="thirdPillarPayment.accountNumberLuminor" />
                      </InfoTooltip>
                    </td>
                  </>
                ) : null}
              </tr>
              <tr>
                <td className="text-nowrap">
                  <FormattedMessage id="thirdPillarPayment.description" />:
                </td>
                <td className="pl-2">
                  <b>
                    {paymentBank !== 'other' && <span>30101119828</span>}
                    {paymentBank === 'other' && <span>30101119828,PK:{pensionAccountNumber}</span>}
                  </b>
                </td>
                <td className="pl-2 d-none d-sm-block">
                  {paymentBank !== 'other' && (
                    <InfoTooltip name="third-pillar-payment-description">
                      <FormattedMessage id="thirdPillarPayment.processingCode" />
                    </InfoTooltip>
                  )}
                  {paymentBank === 'other' && (
                    <InfoTooltip name="third-pillar-payment-description">
                      <FormattedMessage id="thirdPillarPayment.processingCodeAndPensionAccountNumber" />
                    </InfoTooltip>
                  )}
                </td>
              </tr>
              {paymentBank !== 'other' ? (
                <tr>
                  <td className="text-nowrap">
                    <FormattedMessage id="thirdPillarPayment.reference" />:
                  </td>
                  <td className="pl-2">
                    <b>{pensionAccountNumber}</b>
                  </td>
                  <td className="pl-2 d-none d-sm-block">
                    <InfoTooltip name="third-pillar-payment-reference">
                      <FormattedMessage id="thirdPillarPayment.pensionAccountNumber" />
                    </InfoTooltip>
                  </td>
                </tr>
              ) : null}
              {paymentAmount && Number(paymentAmount) > 0 ? (
                <tr>
                  <td className="text-nowrap">
                    <FormattedMessage id="thirdPillarPayment.amount" />
                    :&nbsp;
                  </td>
                  <td className="pl-2">
                    <b>{Number(paymentAmount).toFixed(2)} EUR</b>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
      {paymentBank === 'other' && (
        <div>
          <p className="mt-4">
            {paymentType === PaymentType.RECURRING ? (
              <FormattedMessage id="thirdPillarPayment.recurringPaymentQuestion" />
            ) : (
              <FormattedMessage id="thirdPillarPayment.paymentQuestion" />
            )}
          </p>

          {paymentBank === 'other' && (
            <Link to={nextPath}>
              <button type="button" className="btn btn-primary">
                <FormattedMessage id="thirdPillarPayment.yesButton" />
              </button>
            </Link>
          )}
        </div>
      )}
      {paymentBank !== 'other' && (
        <div className="mt-4">
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
                <FormattedMessage id="thirdPillarPayment.freeSinglePayment" />
              )}
              {paymentType === PaymentType.RECURRING && (
                <FormattedMessage id="thirdPillarPayment.freeRecurringPayment" />
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
