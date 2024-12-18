import React, { Component } from 'react';
import { PropTypes as Types } from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link, Redirect } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';

import { ErrorMessage, Loader } from '../common';
import ComparisonCalculator from './ComparisonCalculator';
import AccountStatement from './AccountStatement';
import { MemberCapital } from './MemberCapital';
import { StatusBox } from './statusBox';
import GreetingBar from './GreetingBar';
import AccountSummary from './AccountSummary';
import { ApplicationSection } from './ApplicationSection/ApplicationSection';
import { isTuleva } from '../common/utils';
import { AccountSummaryLoader } from './AccountSummary/AccountSummary';
import { getInitialCapital } from './actions';
import SecondPillarUpsell from './SecondPillarUpsell/SecondPillarUpsell';
import { getAuthentication } from '../common/authenticationManager';
import { SectionHeading } from './SectionHeading';
import { TransactionSection } from './TransactionSection/TransactionSection';

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

        <ComparisonCalculator />

        <div className="mt-5">
          <SectionHeading titleId="accountSummary.heading" lead>
            <Link className="text-nowrap" to="/withdrawals">
              <FormattedMessage id="accountSummary.withdrawalsLink" />
            </Link>
          </SectionHeading>

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

        <TransactionSection limit={3} />

        <ApplicationSection />

        {!loadingCurrentBalance && (
          <div className="mt-5 mb-4">
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
            <SectionHeading titleId="accountStatement.thirdPillar.heading">
              {!isThirdPillarFullyConverted && (
                <Link className="btn btn-light mb-3" to="/3rd-pillar-flow">
                  <FormattedMessage id="change.my.pension.fund.third.pillar" />
                </Link>
              )}
            </SectionHeading>
            {thirdPillarSourceFunds && thirdPillarSourceFunds.length > 0 && (
              <AccountStatement funds={thirdPillarSourceFunds} />
            )}
          </>
        )}

        {loadingCapital || memberCapital ? (
          <div className="mt-5">
            <SectionHeading titleId="memberCapital.heading">
              <Link className="text-nowrap mb-4" to="/capital">
                <FormattedMessage id="memberCapital.transactions" />
              </Link>
            </SectionHeading>
            {loadingCapital && <Loader className="align-middle" />}
            {memberCapital && <MemberCapital rows={memberCapital} />}
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
  secondPillarSourceFunds: [
    ...(state.exchange.sourceFunds ? state.exchange.sourceFunds : []),
    ...((state.login.user || {}).secondPillarPikNumber
      ? [
          {
            isin: state.login.user.secondPillarPikNumber,
            name: `PIK: ${state.login.user.secondPillarPikNumber}`,
            activeFund: true,
            pillar: 2,
            ongoingChargesFigure: 0,
            price: 0,
            unavailablePrice: 0,
            currency: 'EUR',
          },
        ]
      : []),
  ],
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
