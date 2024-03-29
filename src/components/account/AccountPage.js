import React, { Component } from 'react';
import { PropTypes as Types } from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link, Redirect } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';

import { ErrorMessage, Loader } from '../common';
import ReturnComparison from './ReturnComparison';
import AccountStatement from './AccountStatement';
import MemberCapital from './MemberCapital';
import StatusBox from './statusBox';
import GreetingBar from './GreetingBar';
import AccountSummary from './AccountSummary';
import { ApplicationSection } from './ApplicationSection/ApplicationSection';
import { isTuleva } from '../common/utils';
import { AccountSummaryLoader } from './AccountSummary/AccountSummary';
import { TransactionSection } from './TransactionSection/TransactionSection';
import { getInitialCapital } from './actions';
import SecondPillarUpsell from './SecondPillarUpsell/SecondPillarUpsell';
import { getAuthentication } from '../common/authenticationManager';

const noop = () => null;

export class AccountPage extends Component {
  componentDidMount() {
    this.getData();
  }

  componentDidUpdate() {
    this.getData();
  }

  getData() {
    const { shouldGetMemberCapital, onGetMemberCapital } = this.props;

    if (shouldGetMemberCapital) {
      onGetMemberCapital();
    }
  }

  render() {
    const {
      secondPillarSourceFunds,
      thirdPillarSourceFunds,
      conversion,
      loadingCurrentBalance,
      memberCapital,
      loadingCapital,
      error,
      shouldRedirectToAml,
    } = this.props;

    const isThirdPillarFullyConverted =
      conversion &&
      conversion.thirdPillar.selectionComplete &&
      conversion.thirdPillar.transfersComplete;

    return (
      <>
        {shouldRedirectToAml && (
          <Redirect
            to={{
              pathname: '/aml',
              state: { from: '/account' },
            }}
          />
        )}
        <div className="row mt-5">
          <GreetingBar />
        </div>
        <div className="mt-5">
          <StatusBox />
        </div>
        <div className="mt-5">
          <SecondPillarUpsell />
        </div>

        {error && error.body ? <ErrorMessage errors={error.body} /> : ''}

        <div className="mt-5">
          <p className="mb-4 lead">
            <FormattedMessage id="accountSummary.heading" />
          </p>
          {secondPillarSourceFunds && thirdPillarSourceFunds && conversion ? (
            <AccountSummary
              secondPillarContributions={conversion.secondPillar.contribution.total}
              secondPillarSubtractions={conversion.secondPillar.subtraction.total}
              thirdPillarContributions={conversion.thirdPillar.contribution.total}
              thirdPillarSubtractions={conversion.thirdPillar.subtraction.total}
              memberCapital={memberCapital}
              secondPillarSourceFunds={secondPillarSourceFunds}
              thirdPillarSourceFunds={thirdPillarSourceFunds}
            />
          ) : (
            <AccountSummaryLoader />
          )}
        </div>

        <ReturnComparison />

        <ApplicationSection />

        <TransactionSection limit={3} />

        {!loadingCurrentBalance && (
          <div className="mt-5">
            <p className="mb-4 lead">
              <FormattedMessage id="accountStatement.heading" />
            </p>
            <div className="d-flex flex-md-row flex-column align-items-md-end justify-content-between">
              <div className="mb-3">
                <FormattedMessage id="accountStatement.secondPillar.heading" />
              </div>
              <div className="d-flex flex-sm-row flex-column align-items-sm-end justify-content-between">
                <Link className="btn btn-light mb-3 mr-md-3" to="/2nd-pillar-payment-rate">
                  <FormattedMessage id="account.status.choice.paymentRate.change" />
                </Link>
                <Link className="btn btn-light mb-3" to="/2nd-pillar-flow">
                  <FormattedMessage id="change.my.pension.fund" />
                </Link>
              </div>
            </div>

            {secondPillarSourceFunds && secondPillarSourceFunds.length > 0 && (
              <AccountStatement funds={secondPillarSourceFunds} />
            )}
          </div>
        )}

        {!loadingCurrentBalance && (
          <>
            <div className="mt-4 d-flex flex-sm-row flex-column align-items-sm-end justify-content-between">
              <div className="mb-3">
                <FormattedMessage id="accountStatement.thirdPillar.heading" />
              </div>
              {!isThirdPillarFullyConverted && (
                <Link className="btn btn-light mb-3" to="/3rd-pillar-flow">
                  <FormattedMessage id="change.my.pension.fund.third.pillar" />
                </Link>
              )}
            </div>
            {thirdPillarSourceFunds && thirdPillarSourceFunds.length > 0 && (
              <AccountStatement funds={thirdPillarSourceFunds} />
            )}
          </>
        )}

        {loadingCapital || memberCapital ? (
          <div>
            <div className="mt-5">
              <p className="mb-4 lead">
                <FormattedMessage id="memberCapital.heading" />
              </p>
              {loadingCapital && <Loader className="align-middle" />}
              {memberCapital && <MemberCapital value={memberCapital} />}
            </div>
          </div>
        ) : (
          ''
        )}
      </>
    );
  }
}

AccountPage.propTypes = {
  user: Types.shape({}),
  secondPillarSourceFunds: Types.arrayOf(Types.shape({})),
  thirdPillarSourceFunds: Types.arrayOf(Types.shape({})),
  loadingCurrentBalance: Types.bool,
  shouldGetMemberCapital: Types.bool,
  onGetMemberCapital: Types.func,
  memberCapital: Types.shape({}),
  loadingCapital: Types.bool,
  error: Types.shape({
    body: Types.shape({}),
  }),
  shouldRedirectToAml: Types.bool,
};

AccountPage.defaultProps = {
  user: {},
  secondPillarSourceFunds: [],
  thirdPillarSourceFunds: [],
  loadingCurrentBalance: false,
  shouldGetMemberCapital: true,
  onGetMemberCapital: noop,
  memberCapital: {},
  loadingCapital: false,
  error: null,
  shouldRedirectToAml: false,
};

export const shouldRedirectToAml = (state) =>
  state.aml.missingAmlChecks &&
  state.aml.missingAmlChecks.length > 0 &&
  !state.aml.createAmlChecksSuccess &&
  state.login.user &&
  state.login.user.thirdPillarActive &&
  state.thirdPillar.sourceFunds &&
  state.thirdPillar.sourceFunds.some(
    (fund) => isTuleva(fund) && (fund.price + fund.unavailablePrice > 0 || fund.activeFund),
  );

const mapStateToProps = (state) => ({
  secondPillarSourceFunds: state.exchange.sourceFunds,
  thirdPillarSourceFunds: state.thirdPillar.sourceFunds,
  conversion: state.login.userConversion,
  loadingCurrentBalance: state.exchange.loadingSourceFunds,
  shouldGetMemberCapital:
    getAuthentication().isAuthenticated() &&
    state.login.user &&
    state.login.user.memberNumber &&
    !state.account.initialCapital &&
    !state.account.loadingInitialCapital,
  memberCapital: state.account.initialCapital,
  loadingCapital: state.account.loadingInitialCapital,
  error: state.exchange.error,
  shouldRedirectToAml: shouldRedirectToAml(state),
});
const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      onGetMemberCapital: getInitialCapital,
    },
    dispatch,
  );

const withRedux = connect(mapStateToProps, mapDispatchToProps);

export default withRedux(AccountPage);
