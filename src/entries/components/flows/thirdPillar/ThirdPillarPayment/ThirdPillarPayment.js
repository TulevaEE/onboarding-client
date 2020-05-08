import React, { Component } from 'react';
import Types from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link, Redirect } from 'react-router-dom';
import { Message } from 'retranslate';
import { updateUser, userUpdated } from '../../../common/user/actions';
import { changeMonthlyContribution, thirdPillarStatistics } from '../../../thirdPillar/actions';

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
      monthlyContribution,
      pensionAccountNumber,
      isUserConverted,
      onMonthlyContributionChange,
      onSubmit,
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

        <div>
          <Message>thirdPillarPayment.accountName</Message>: <b>Pensionikeskus AS</b>
        </div>
        <div>
          <Message>thirdPillarPayment.accountNumber</Message>: <b>EE362200221067235244</b>
        </div>
        <div>
          <Message>thirdPillarPayment.details</Message>: <b>30101119828</b>
        </div>
        <div>
          <Message>thirdPillarPayment.reference</Message>:{' '}
          <b data-test-id="pension-account-number">{pensionAccountNumber}</b>
        </div>
        <div className="form-inline">
          <div className="form-group">
            <label htmlFor="monthly-contribution">
              <Message>thirdPillarPayment.amount</Message>:{' '}
            </label>
            <div className="input-group m-sm-2">
              <input
                id="monthly-contribution"
                type="number"
                value={monthlyContribution || ''}
                onChange={event => {
                  onMonthlyContributionChange(parseInt(event.target.value, 10));
                }}
                placeholder="150"
                className="form-control"
              />
              <div className="input-group-append">
                <span className="input-group-text">EUR</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <Link to={nextPath}>
            <button
              type="button"
              className="btn btn-primary mt-4 mr-2"
              onClick={() => {
                onSubmit({ mandateId: signedMandateId, recurringPayment: monthlyContribution });
              }}
              disabled={!monthlyContribution}
            >
              <Message>thirdPillarPayment.recurringPaymentButton</Message>
            </button>
          </Link>
          <Link to={nextPath}>
            <button
              type="button"
              className="btn btn-primary mt-4"
              onClick={() => {
                onSubmit({ mandateId: signedMandateId, singlePayment: monthlyContribution });
              }}
              disabled={!monthlyContribution}
            >
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
  monthlyContribution: Types.number,
  pensionAccountNumber: Types.string,
  user: Types.shape({}),
  isUserConverted: Types.bool,

  saveUser: Types.func,
  userSaved: Types.func,
  onMonthlyContributionChange: Types.func,
  onSubmit: Types.func,
};

ThirdPillarPayment.defaultProps = {
  previousPath: '',
  nextPath: '',

  signedMandateId: null,
  monthlyContribution: null,
  pensionAccountNumber: null,
  isUserConverted: false,
  user: {},

  saveUser: noop,
  userSaved: noop,
  onMonthlyContributionChange: noop,
  onSubmit: noop,
};

const mapStateToProps = state => ({
  signedMandateId: state.thirdPillar.signedMandateId,
  monthlyContribution: state.thirdPillar.monthlyContribution,
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
      onMonthlyContributionChange: changeMonthlyContribution,
      onSubmit: thirdPillarStatistics,
    },
    dispatch,
  );

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ThirdPillarPayment);
