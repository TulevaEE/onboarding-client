import React, { useState } from 'react';
import Types from 'prop-types';
import { connect } from 'react-redux';
import { Link, Redirect } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { Radio } from '../../../common';
import ThirdPillarPaymentsThisYear from '../../../account/statusBox/thirdPillarStatusBox/ThirdPillarYearToDateContribution';
import './ThirdPillarPayment2.scss';

export const ThirdPillarPayment2 = ({
  previousPath,
  nextPath,
  signedMandateId,
  pensionAccountNumber,
  isUserConverted,
}) => {
  const [paymentType, setPaymentType] = useState('SINGLE');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentBank, setPaymentBank] = useState('');

  const onPayment = (amount, bank) => {
    // eslint-disable-next-line no-console
    console.log(amount, bank);
  };

  return (
    <>
      {false && !signedMandateId && !isUserConverted && <Redirect to={previousPath} />}

      <b>
        <FormattedMessage id="thirdPillarPayment.paymentType" />
      </b>

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
                min="0"
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
          </div>

          <div className="mt-5">
            <b>
              <FormattedMessage id="thirdPillarPayment.paymentBank" />
            </b>
          </div>

          <div className="mt-2">
            <div className="btn-group-toggle d-inline-block mt-2 mr-2">
              <label
                className={`btn btn-light btn-payment text-nowrap ${
                  paymentBank === 'SWEDBANK' ? 'active' : ''
                }`}
              >
                <input
                  type="radio"
                  name="banks"
                  id="swedbank"
                  checked={paymentBank === 'SWEDBANK'}
                  onChange={() => {
                    setPaymentBank('SWEDBANK');
                  }}
                />
                Swedbank
              </label>
            </div>

            <div className="btn-group-toggle d-inline-block mt-2 mr-2">
              <label
                className={`btn btn-light btn-payment text-nowrap ${
                  paymentBank === 'SEB' ? 'active' : ''
                }`}
              >
                <input
                  type="radio"
                  name="banks"
                  id="seb"
                  checked={paymentBank === 'SEB'}
                  onChange={() => {
                    setPaymentBank('SEB');
                  }}
                />
                SEB
              </label>
            </div>

            <div className="btn-group-toggle d-inline-block mt-2 mr-2">
              <label
                className={`btn btn-light btn-payment text-nowrap ${
                  paymentBank === 'LHV' ? 'active' : ''
                }`}
              >
                <input
                  type="radio"
                  name="banks"
                  id="lhv"
                  checked={paymentBank === 'LHV'}
                  onChange={() => {
                    setPaymentBank('LHV');
                  }}
                />
                LHV
              </label>
            </div>

            <div className="btn-group-toggle d-inline-block mt-2 mr-2">
              <label
                className={`btn btn-light btn-payment text-nowrap ${
                  paymentBank === 'LUMINOR' ? 'active' : ''
                }`}
              >
                <input
                  type="radio"
                  name="banks"
                  id="luminor"
                  checked={paymentBank === 'LUMINOR'}
                  onChange={() => {
                    setPaymentBank('Luminor');
                  }}
                />
                Luminor
              </label>
            </div>

            <div className="btn-group-toggle d-inline-block mt-2 mr-2">
              <label
                className={`btn btn-light btn-payment text-nowrap ${
                  paymentBank === 'OTHER' ? 'active' : ''
                }`}
              >
                <input
                  type="radio"
                  name="banks"
                  id="other"
                  checked={paymentBank === 'OTHER'}
                  onChange={() => {
                    setPaymentBank('OTHER');
                  }}
                />
                <FormattedMessage id="thirdPillarPayment.otherBank" />
              </label>
            </div>
          </div>

          {paymentBank !== 'OTHER' && paymentType === 'SINGLE' && (
            <div className="mt-5">
              <button
                type="button"
                className="btn btn-primary"
                disabled={
                  !paymentBank || paymentBank === 'OTHER' || !paymentAmount || paymentAmount <= 0
                }
                onClick={() => {
                  onPayment(paymentAmount, paymentBank);
                }}
              >
                <FormattedMessage id="thirdPillarPayment.makePayment" />
              </button>
            </div>
          )}
        </div>
      )}

      {(paymentBank === 'OTHER' || paymentType === 'RECURRING') && (
        <div className="mt-4">
          <p>
            <FormattedMessage
              id="thirdPillarPayment.description"
              values={{ b: (chunks) => <b>{chunks}</b> }}
            />
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
                <b>EE362200221067235244</b> - Swedbank
                <br />
                <b>EE141010220263146225</b> - SEB
                <br />
                <b>EE547700771002908125</b> - LHV
                <br />
                <b>EE961700017004379157</b> - Luminor
              </td>
            </tr>
            <tr>
              <td>
                <FormattedMessage id="thirdPillarPayment.details" />
                :&nbsp;
              </td>
              <td>
                <b>30101119828</b>
              </td>
            </tr>
            <tr>
              <td>
                <FormattedMessage id="thirdPillarPayment.reference" />
                :&nbsp;
              </td>
              <td>
                <b data-test-id="pension-account-number">{pensionAccountNumber}</b>
              </td>
            </tr>
          </table>

          {(paymentBank === 'OTHER' || paymentType === 'RECURRING') && (
            <div className="mt-4">
              <ThirdPillarPaymentsThisYear />
            </div>
          )}

          <p className="mt-4">
            <FormattedMessage id="thirdPillarPayment.paymentQuestion" />
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

ThirdPillarPayment2.propTypes = {
  previousPath: Types.string,
  nextPath: Types.string,

  signedMandateId: Types.number,
  pensionAccountNumber: Types.string,
  isUserConverted: Types.bool,
};

ThirdPillarPayment2.defaultProps = {
  previousPath: '',
  nextPath: '',

  signedMandateId: null,
  pensionAccountNumber: null,
  isUserConverted: false,
};

const mapStateToProps = (state) => ({
  signedMandateId: state.thirdPillar.signedMandateId,
  pensionAccountNumber: state.login.user && state.login.user.pensionAccountNumber,
  isUserConverted:
    state.thirdPillar.exchangeableSourceFunds &&
    !state.thirdPillar.exchangeableSourceFunds.length &&
    state.login.userConversion &&
    state.login.userConversion.thirdPillar.selectionComplete,
});

export default connect(mapStateToProps)(ThirdPillarPayment2);
