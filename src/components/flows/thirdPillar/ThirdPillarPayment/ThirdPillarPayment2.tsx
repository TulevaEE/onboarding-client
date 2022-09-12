import React, { useState } from 'react';
import { connect } from 'react-redux';
import { Link, Redirect } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import config from 'react-global-configuration';
import { Radio } from '../../../common';
import ThirdPillarPaymentsThisYear from '../../../account/statusBox/thirdPillarStatusBox/ThirdPillarYearToDateContribution';
import './ThirdPillarPayment2.scss';
import { BankButton } from './BankButton';
import { State } from '../../../../types';

export const ThirdPillarPayment2: React.FunctionComponent<{
  previousPath: string;
  nextPath: string;
  signedMandateId: number;
  pensionAccountNumber: string;
  isUserConverted: boolean;
}> = ({ previousPath, nextPath, signedMandateId, pensionAccountNumber, isUserConverted }) => {
  const { formatMessage } = useIntl();

  const [paymentType, setPaymentType] = useState('SINGLE');
  const [paymentAmount, setPaymentAmount] = useState<string | undefined>(undefined);
  const [paymentBank, setPaymentBank] = useState('');

  return (
    <>
      {false && !signedMandateId && !isUserConverted && <Redirect to={previousPath} />}

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
        selected={paymentType === 'SINGLE'}
        onSelect={() => {
          setPaymentType('SINGLE');
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
        selected={paymentType === 'RECURRING'}
        onSelect={() => {
          setPaymentType('RECURRING');
        }}
      >
        <p className="m-0">
          <FormattedMessage id="thirdPillarPayment.recurringPayment" />
        </p>
      </Radio>

      {paymentType === 'SINGLE' && (
        <div>
          <div className="mt-5">
            <b>
              <FormattedMessage id="thirdPillarPayment.paymentAmount" />
            </b>
          </div>

          <div className="form-inline">
            <div className="input-group input-group-lg mt-2">
              <input
                id="monthly-contribution"
                type="number"
                placeholder="200"
                className="form-control form-control-lg"
                min="0.00"
                step="0.01"
                value={paymentAmount}
                onChange={(event) => setPaymentAmount(event.target.value)}
                onWheel={(event) => event.currentTarget.blur()}
              />
              <div className="input-group-append">
                <span className="input-group-text">&euro;</span>
              </div>
            </div>
          </div>

          <div className="mt-2">
            <ThirdPillarPaymentsThisYear />
            <div>
              <small className="text-muted">
                <a
                  href="//tuleva.ee/vastused/kolmanda-samba-kysimused/"
                  target="_blank"
                  rel="noreferrer"
                >
                  <FormattedMessage id="thirdPillarPayment.singlePaymentHowMuch" />
                </a>
              </small>
            </div>
          </div>

          <div className="mt-5">
            <b>
              <FormattedMessage id="thirdPillarPayment.paymentBank" />
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

          {paymentBank !== 'other' && paymentType === 'SINGLE' && (
            <div className="mt-5">
              <a
                href={`${config.get(
                  'applicationUrl',
                )}/payments/link?amount=${paymentAmount}&currency=EUR&bank=${paymentBank}`}
              >
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={
                    !paymentBank ||
                    paymentBank === 'other' ||
                    !paymentAmount ||
                    Number(paymentAmount) <= 0
                  }
                >
                  <FormattedMessage id="thirdPillarPayment.makePayment" />
                </button>
              </a>
            </div>
          )}
        </div>
      )}

      {(paymentBank === 'other' || paymentType === 'RECURRING') && (
        <div className="mt-4">
          <p>
            {paymentType === 'RECURRING' ? (
              <FormattedMessage
                id="thirdPillarPayment.recurringPaymentDescription"
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
            <tr>
              <td>
                <FormattedMessage id="thirdPillarPayment.accountName" />
                :&nbsp;
              </td>
              <td>
                <b>AS Pensionikeskus</b>
              </td>
            </tr>
            <tr>
              <td className="align-top">
                <FormattedMessage id="thirdPillarPayment.accountNumber" />
                :&nbsp;
              </td>
              <td>
                <b>EE362200221067235244</b>
                {paymentType === 'RECURRING' && (
                  <span>
                    {' '}
                    - Swedbank
                    <br />
                    <b>EE141010220263146225</b> - SEB
                    <br />
                    <b>EE547700771002908125</b> - LHV
                    <br />
                    <b>EE961700017004379157</b> - Luminor
                  </span>
                )}
              </td>
            </tr>
            <tr>
              <td>
                <FormattedMessage id="thirdPillarPayment.description" />
                :&nbsp;&nbsp;&nbsp;&nbsp;
              </td>
              <td>
                <b>
                  30101119828
                  {paymentType === 'SINGLE' && <span>,PK:{pensionAccountNumber}</span>}
                </b>
              </td>
            </tr>
            {paymentType === 'RECURRING' && (
              <tr>
                <td>
                  <FormattedMessage id="thirdPillarPayment.reference" />
                  :&nbsp;
                </td>
                <td>
                  <b data-test-id="pension-account-number">{pensionAccountNumber}</b>
                </td>
              </tr>
            )}
            {paymentType === 'SINGLE' && paymentAmount && Number(paymentAmount) > 0 && (
              <tr>
                <td>
                  <FormattedMessage id="thirdPillarPayment.amount" />
                  :&nbsp;
                </td>
                <td>
                  <b>{Number(paymentAmount).toFixed(2)} EUR</b>
                </td>
              </tr>
            )}
          </table>

          {paymentType === 'RECURRING' && (
            <div className="mt-4">
              <ThirdPillarPaymentsThisYear />
              <div>
                <small className="text-muted">
                  <a
                    href="//tuleva.ee/vastused/kolmanda-samba-kysimused/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FormattedMessage id="thirdPillarPayment.recurringPaymentHowTo" />
                  </a>
                </small>
              </div>
              <div>
                <small className="text-muted">
                  <a
                    href="//tuleva.ee/vastused/kolmanda-samba-kysimused/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FormattedMessage id="thirdPillarPayment.recurringPaymentHowMuch" />
                  </a>
                </small>
              </div>
            </div>
          )}

          <p className="mt-4">
            {paymentType === 'RECURRING' ? (
              <FormattedMessage id="thirdPillarPayment.recurringPaymentQuestion" />
            ) : (
              <FormattedMessage id="thirdPillarPayment.paymentQuestion" />
            )}
          </p>

          <Link to={nextPath}>
            <button type="button" className="btn btn-primary">
              <FormattedMessage id="thirdPillarPayment.paymentButton" />
            </button>
          </Link>
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
});

export default connect(mapStateToProps)(ThirdPillarPayment2);
