import React, { Component } from 'react';
import { PropTypes as Types } from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Message } from 'retranslate';

import { Loader, ErrorMessage } from '../common';
import PendingExchangesTable from './pendingExchangeTable';
import ReturnComparison from './ReturnComparison';
import { actions as accountActions } from '.';
import { actions as exchangeActions } from '../exchange';
import AccountStatement from './AccountStatement';
import MemberCapital from './MemberCapital';
import StatusBox from './statusBox';
import GreetingBar from './GreetingBar';
import AccountSummary from './AccountSummary';

const noop = () => null;

export class AccountPage extends Component {
  componentDidMount() {
    this.getData();
  }

  getData() {
    const {
      shouldGetMemberCapital,
      onGetMemberCapital,
      shouldGetPendingExchanges,
      onGetPendingExchanges,
    } = this.props;

    if (shouldGetMemberCapital) {
      onGetMemberCapital();
    }
    if (shouldGetPendingExchanges) {
      onGetPendingExchanges();
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
      pendingExchanges,
      loadingPendingExchanges,
      error,
    } = this.props;

    const pendingExchangesSection = loadingPendingExchanges ? (
      <Loader className="align-middle mt-5" />
    ) : (
      pendingExchanges &&
      pendingExchanges.length > 0 && (
        <div className="mt-5">
          <p className="mb-4 lead">
            <Message>pending.exchanges.lead</Message>
          </p>
          <PendingExchangesTable pendingExchanges={pendingExchanges} />
        </div>
      )
    );

    return (
      <>
        <div className="row mt-5">
          <GreetingBar />
        </div>
        <div className="mt-5">
          {secondPillarSourceFunds && secondPillarSourceFunds.length > 0 && <StatusBox />}
          <div>
            {secondPillarSourceFunds && secondPillarSourceFunds.length === 0 ? (
              <Message>account.second.pillar.missing</Message>
            ) : (
              ''
            )}
          </div>
        </div>

        {false && secondPillarSourceFunds && thirdPillarSourceFunds && conversion && (
          <div className="mt-5">
            <p className="mb-4 lead">
              <Message>accountSummary.heading</Message>
            </p>
            <AccountSummary
              secondPillarTotal={conversion.secondPillar.contribution.total}
              thirdPillarTotal={conversion.thirdPillar.contribution.total}
              secondPillarSourceFunds={secondPillarSourceFunds}
              thirdPillarSourceFunds={thirdPillarSourceFunds}
            />
          </div>
        )}

        {error ? <ErrorMessage errors={error.body} /> : ''}
        {loadingCurrentBalance && <Loader className="align-middle" />}
        {secondPillarSourceFunds && secondPillarSourceFunds.length > 0 && (
          <>
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
            <AccountStatement funds={secondPillarSourceFunds} />
          </>
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

        {pendingExchangesSection}

        <ReturnComparison />

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
  shouldGetPendingExchanges: Types.bool,
  onGetPendingExchanges: Types.func,
  pendingExchanges: Types.arrayOf(Types.shape({})),
  loadingPendingExchanges: Types.bool,
  shouldGetMemberCapital: Types.bool,
  onGetMemberCapital: Types.func,
  memberCapital: Types.shape({}),
  loadingCapital: Types.bool,
  error: Types.shape({
    body: Types.object,
  }),
};

AccountPage.defaultProps = {
  user: {},
  secondPillarSourceFunds: [],
  thirdPillarSourceFunds: [],
  loadingCurrentBalance: false,
  shouldGetPendingExchanges: true,
  onGetPendingExchanges: noop,
  pendingExchanges: [],
  loadingPendingExchanges: false,
  shouldGetMemberCapital: true,
  onGetMemberCapital: noop,
  memberCapital: {},
  loadingCapital: false,
  error: null,
};

const mapStateToProps = state => ({
  secondPillarSourceFunds: state.exchange.sourceFunds,
  thirdPillarSourceFunds: state.thirdPillar.sourceFunds,
  conversion: state.login.userConversion,
  loadingCurrentBalance: state.exchange.loadingSourceFunds,
  shouldGetPendingExchanges:
    state.login.token &&
    !(state.exchange.pendingExchanges || state.exchange.loadingPendingExchanges),
  pendingExchanges: state.exchange.pendingExchanges,
  loadingPendingExchanges: state.exchange.loadingPendingExchanges,
  shouldGetMemberCapital:
    state.login.token &&
    state.login.user &&
    state.login.user.memberNumber &&
    !(state.account.initialCapital || state.account.loadingInitialCapital),
  memberCapital: state.account.initialCapital,
  loadingCapital: state.account.loadingInitialCapital,
  error: state.exchange.error,
  token: state.login.token,
});
const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      onGetMemberCapital: accountActions.getInitialCapital,
      onGetPendingExchanges: exchangeActions.getPendingExchanges,
    },
    dispatch,
  );

const withRedux = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default withRedux(AccountPage);
