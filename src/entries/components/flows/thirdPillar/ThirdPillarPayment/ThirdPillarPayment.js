import React, { Component, Fragment } from 'react';
import Types from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link, Redirect } from 'react-router-dom';
import { Message } from 'retranslate';
import { updateUser, userUpdated } from '../../../common/user/actions';

export class ThirdPillarPayment extends Component {
  async componentDidMount() {
    const { user, saveUser, userSaved } = this.props;
    await saveUser(user);
    await userSaved();
  }

  render() {
    const {
      previousPath,
      nextPath,
      signedMandateId,
      monthlyContribution,
      pensionAccountNumber,
    } = this.props;
    return (
      <Fragment>
        {!signedMandateId && <Redirect to={previousPath} />}

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

        <div>
          <Message>thirdPillarPayment.accountName</Message>: <b>Pensionikeskus AS</b>
        </div>
        <div>
          <Message>thirdPillarPayment.accountNumber</Message>: <b>EE362200221067235244</b>
        </div>
        <div>
          <Message>thirdPillarPayment.amount</Message>:{' '}
          <b data-test-id="monthly-contribution">{monthlyContribution} EUR</b>
        </div>
        <div>
          <Message>thirdPillarPayment.details</Message>: <b>30101119828</b>
        </div>
        <div>
          <Message>thirdPillarPayment.reference</Message>:{' '}
          <b data-test-id="pension-account-number">{pensionAccountNumber}</b>
        </div>

        <div>
          <Link to={nextPath}>
            <button type="button" className="btn btn-primary mt-4">
              <Message>thirdPillarPayment.paymentButton</Message>
            </button>
          </Link>
        </div>
      </Fragment>
    );
  }
}

const noop = () => null;

ThirdPillarPayment.propTypes = {
  previousPath: Types.string,
  nextPath: Types.string,

  signedMandateId: Types.number,
  monthlyContribution: Types.number,
  pensionAccountNumber: Types.string,
  user: Types.shape({}),

  saveUser: Types.func,
  userSaved: Types.func,
};

ThirdPillarPayment.defaultProps = {
  previousPath: '',
  nextPath: '',

  signedMandateId: null,
  monthlyContribution: null,
  pensionAccountNumber: null,
  user: {},

  saveUser: noop,
  userSaved: noop,
};

const mapStateToProps = state => ({
  signedMandateId: state.thirdPillar.signedMandateId,
  monthlyContribution: state.thirdPillar.monthlyContribution,
  pensionAccountNumber: state.login.user ? state.login.user.pensionAccountNumber : null,
  user: state.login.user,
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
