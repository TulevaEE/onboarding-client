import React, { useState } from 'react';
import Types from 'prop-types';
import { connect } from 'react-redux';
import { Link, Redirect } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { Radio } from '../../../common';
import ThirdPillarPaymentsThisYear from '../../../account/statusBox/thirdPillarStatusBox/ThirdPillarYearToDateContribution';

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

      <b>Millist tüüpi makset soovid teha?</b>

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
            <b>Kui suures summas soovid sissemakset teha?</b>
          </div>
          <ThirdPillarPaymentsThisYear />

          <div className="form-inline">
            <div className="form-group">
              <div className="input-group mt-2">
                <input
                  id="monthly-contribution"
                  type="number"
                  placeholder="200"
                  className="form-control"
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
          </div>

          <div className="mt-5">
            <b>Vali pank, kust soovid makset teha:</b>
          </div>

          <div className="btn-group btn-group-toggle mt-2" data-toggle="buttons">
            <label
              className={`btn btn-light ${paymentBank === 'SWEDBANK' ? 'active' : ''}`}
              onClick={() => {
                setPaymentBank('SWEDBANK');
              }}
            >
              <input type="radio" name="banks" id="swedbank" checked={paymentBank === 'SWEDBANK'} />{' '}
              Swedbank
            </label>
            <label
              className={`btn btn-light ${paymentBank === 'SEB' ? 'active' : ''}`}
              onClick={() => {
                setPaymentBank('SEB');
              }}
            >
              <input type="radio" name="banks" id="seb" checked={paymentBank === 'SEB'} /> SEB
            </label>
            <label
              className={`btn btn-light ${paymentBank === 'LHV' ? 'active' : ''}`}
              onClick={() => {
                setPaymentBank('LHV');
              }}
            >
              <input type="radio" name="banks" id="lhv" checked={paymentBank === 'LHV'} /> LHV
            </label>
            <label
              className={`btn btn-light ${paymentBank === 'LUMINOR' ? 'active' : ''}`}
              onClick={() => {
                setPaymentBank('LUMINOR');
              }}
            >
              <input type="radio" name="banks" id="luminor" checked={paymentBank === 'LUMINOR'} />{' '}
              Luminor
            </label>
            <label
              className={`btn btn-light ${paymentBank === 'OTHER' ? 'active' : ''}`}
              onClick={() => {
                setPaymentBank('OTHER');
              }}
            >
              <input type="radio" name="banks" id="other" checked={paymentBank === 'OTHER'} />{' '}
              Muu&nbsp;pank
            </label>
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
                <FormattedMessage id="thirdPillarPayment.accountName" />:{' '}
              </td>
              <td>
                <b>AS Pensionikeskus</b>
              </td>
            </tr>
            <tr>
              <td className="align-top">
                <FormattedMessage id="thirdPillarPayment.accountNumber" />:{' '}
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
                <FormattedMessage id="thirdPillarPayment.details" />:{' '}
              </td>
              <td>
                <b>30101119828</b>
              </td>
            </tr>
            <tr>
              <td>
                <FormattedMessage id="thirdPillarPayment.reference" />:{' '}
              </td>
              <td>
                <b data-test-id="pension-account-number">{pensionAccountNumber}</b>
              </td>
            </tr>
          </table>

          <p className="mt-5">
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
