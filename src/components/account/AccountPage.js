import React, { Component } from 'react';
import { PropTypes as Types } from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link, Redirect } from 'react-router-dom';
import { Message } from 'retranslate';

import { Loader, ErrorMessage } from '../common';
import ReturnComparison from './ReturnComparison';
import { actions as accountActions } from '.';
import AccountStatement from './AccountStatement';
import MemberCapital from './MemberCapital';
import StatusBox from './statusBox';
import GreetingBar from './GreetingBar';
import AccountSummary from './AccountSummary';
import { ApplicationSection } from './ApplicationSection/ApplicationSection';
import { ACCOUNT_PATH, AML_PATH } from '../LoggedInApp';
import { isTuleva } from '../common/utils';
import { AccountSummaryLoader } from './AccountSummary/AccountSummary';

const noop = () => null;

export class AccountPage extends Component {
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

    return (
      <>
        {shouldRedirectToAml && (
          <Redirect
            to={{
              pathname: AML_PATH,
              state: { from: ACCOUNT_PATH },
            }}
          />
        )}
        <div className="row mt-5">
          <GreetingBar />
        </div>
        <div className="mt-5">
          <StatusBox />
        </div>

        {error && error.body ? <ErrorMessage errors={error.body} /> : ''}

        <div className="mt-5">
          <p className="mb-4 lead">
            <Message>accountSummary.heading</Message>
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

        {!loadingCurrentBalance && (
          <div className="mt-5">
            <p className="mb-4 lead">
              <Message>accountStatement.heading</Message>
            </p>
            <div className="row">
              <div className="col-md-6 mb-2 mt-4">
                <Message className="mb-2 lead h5">accountStatement.secondPillar.heading</Message>
              </div>

              <div className="col-md-6 mb-1 mt-2 text-md-right">
                <Link className="btn btn-primary" to="/2nd-pillar-flow">
                  <Message>change.my.pension.fund</Message>
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
            <div className="row">
              <div className="col-md-6 mb-2 mt-4">
                <Message className="mb-2 lead h5">accountStatement.thirdPillar.heading</Message>
              </div>

              <div className="col-md-6 mb-1 mt-2 text-md-right">
                <Link className="btn btn-primary" to="/3rd-pillar-flow">
                  <Message>change.my.pension.fund.third.pillar</Message>
                </Link>
              </div>
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
                <Message>memberCapital.heading</Message>
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

const mapStateToProps = (state) => ({
  secondPillarSourceFunds: state.exchange.sourceFunds,
  thirdPillarSourceFunds: state.thirdPillar.sourceFunds,
  conversion: state.login.userConversion,
  loadingCurrentBalance: state.exchange.loadingSourceFunds,
  shouldGetMemberCapital:
    state.login.token &&
    state.login.user &&
    state.login.user.memberNumber &&
    !(state.account.initialCapital || state.account.loadingInitialCapital),
  memberCapital: state.account.initialCapital,
  loadingCapital: state.account.loadingInitialCapital,
  error: state.exchange.error,
  token: state.login.token,
  shouldRedirectToAml:
    state.aml.missingAmlChecks &&
    state.aml.missingAmlChecks.length > 0 &&
    !state.aml.createAmlChecksSuccess &&
    state.thirdPillar.sourceFunds &&
    state.thirdPillar.sourceFunds.some((fund) => isTuleva(fund)),
});
const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      onGetMemberCapital: accountActions.getInitialCapital,
    },
    dispatch,
  );

const withRedux = connect(mapStateToProps, mapDispatchToProps);

export default withRedux(AccountPage);
