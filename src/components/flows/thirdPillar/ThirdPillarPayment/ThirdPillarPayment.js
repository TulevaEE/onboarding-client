import React, { useEffect } from 'react';
import Types from 'prop-types';
import { connect } from 'react-redux';
import { Link, Redirect } from 'react-router-dom';
import { Message } from 'retranslate';
import { bindActionCreators } from 'redux';
import { getUser } from '../../../login/actions';

export const ThirdPillarPayment = ({
  previousPath,
  nextPath,
  signedMandateId,
  pensionAccountNumber,
  isUserConverted,
  onGetUser,
}) => {
  useEffect(async () => {
    if (pensionAccountNumber === null) {
      await onGetUser();
    }
  });

  return (
    <>
      {!signedMandateId && !isUserConverted && <Redirect to={previousPath} />}

      <h2 className="mt-3">
        <Message>thirdPillarPayment.title</Message>
      </h2>

      <p className="mt-3">
        <Message
          params={{
            emphasized: (
              <b>
                <Message>thirdPillarPayment.descriptionEmphasized</Message>
              </b>
            ),
          }}
        >
          thirdPillarPayment.description
        </Message>
      </p>

      <table>
        <tr>
          <td>
            <Message>thirdPillarPayment.accountName</Message>:{' '}
          </td>
          <td>
            <b>AS Pensionikeskus</b>
          </td>
        </tr>
        <tr>
          <td className="align-top">
            <Message>thirdPillarPayment.accountNumber</Message>:{' '}
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
            <Message>thirdPillarPayment.details</Message>:{' '}
          </td>
          <td>
            <b>30101119828</b>
          </td>
        </tr>
        <tr>
          <td>
            <Message>thirdPillarPayment.reference</Message>:{' '}
          </td>
          <td>
            <b data-test-id="pension-account-number">{pensionAccountNumber}</b>
          </td>
        </tr>
      </table>

      <p className="mt-3">
        <Message>thirdPillarPayment.paymentQuestion</Message>
      </p>

      <div>
        <Link to={nextPath}>
          <button type="button" className="btn btn-primary mt-4">
            <Message>thirdPillarPayment.paymentButton</Message>
          </button>
        </Link>
      </div>
    </>
  );
};

ThirdPillarPayment.propTypes = {
  previousPath: Types.string,
  nextPath: Types.string,

  signedMandateId: Types.number,
  pensionAccountNumber: Types.string,
  isUserConverted: Types.bool,
};

ThirdPillarPayment.defaultProps = {
  previousPath: '',
  nextPath: '',

  signedMandateId: null,
  pensionAccountNumber: null,
  isUserConverted: false,
};

const mapStateToProps = (state) => ({
  signedMandateId: state.thirdPillar.signedMandateId,
  pensionAccountNumber: state.login.user ? state.login.user.pensionAccountNumber : null,
  isUserConverted:
    state.thirdPillar.exchangeableSourceFunds &&
    !state.thirdPillar.exchangeableSourceFunds.length &&
    state.login.userConversion &&
    state.login.userConversion.thirdPillar.selectionComplete,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({ onGetUser: getUser }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(ThirdPillarPayment);
