import React, { Component } from 'react';
import Types from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link, Redirect } from 'react-router-dom';
import { Message } from 'retranslate';
import { updateUser, userUpdated } from '../../../common/user/actions';

export class ThirdPillarPayment extends Component {
  async componentDidMount() {
    const { user, saveUser, userSaved } = this.props;
    if (user) {
      await saveUser(user);
      await userSaved();
    }
  }

  render() {
    const {
      previousPath,
      nextPath,
      signedMandateId,
      pensionAccountNumber,
      isUserConverted,
    } = this.props;
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
            <td>
              <Message>thirdPillarPayment.accountNumber</Message>:{' '}
            </td>
            <td>
              <b>EE362200221067235244</b> - Swedbank
              <br />
              <b>EE141010220263146225</b> - SEB
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

        <div>
          <Link to={nextPath}>
            <button type="button" className="btn btn-primary mt-4">
              <Message>thirdPillarPayment.paymentButton</Message>
            </button>
          </Link>
        </div>
      </>
    );
  }
}

const noop = () => null;

ThirdPillarPayment.propTypes = {
  previousPath: Types.string,
  nextPath: Types.string,

  signedMandateId: Types.number,
  pensionAccountNumber: Types.string,
  user: Types.shape({}),
  isUserConverted: Types.bool,

  saveUser: Types.func,
  userSaved: Types.func,
};

ThirdPillarPayment.defaultProps = {
  previousPath: '',
  nextPath: '',

  signedMandateId: null,
  pensionAccountNumber: null,
  isUserConverted: false,
  user: {},

  saveUser: noop,
  userSaved: noop,
};

const mapStateToProps = state => ({
  signedMandateId: state.thirdPillar.signedMandateId,
  pensionAccountNumber: state.login.user ? state.login.user.pensionAccountNumber : null,
  user: state.login.user,
  isUserConverted:
    state.thirdPillar.exchangeableSourceFunds &&
    !state.thirdPillar.exchangeableSourceFunds.length &&
    state.login.userConversion &&
    state.login.userConversion.thirdPillar.selectionComplete,
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      saveUser: updateUser,
      userSaved: userUpdated,
    },
    dispatch,
  );

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ThirdPillarPayment);
