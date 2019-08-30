import React, { Component } from 'react';
import { PropTypes as Types } from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Message } from 'retranslate';

import { Loader, ErrorMessage } from '../common';
import PendingExchangesTable from './pendingExchangeTable';
import ReturnComparison from './ReturnComparison';
import UpdateUserForm from './updateUserForm';
import { updateUser } from '../common/user/actions';
import { actions as accountActions } from '.';
import { actions as exchangeActions } from '../exchange';
import AccountStatement from './AccountStatement';
import MemberCapital from './MemberCapital';

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
      loadingCurrentBalance,
      memberCapital,
      loadingCapital,
      memberNumber,
      conversion,
      pendingExchanges,
      loadingPendingExchanges,
      saveUser,
      error,
      token,
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
        <div className="mt-5">
          {/* <StatusBox */}
          {/*  currentBalanceFunds={currentBalanceFunds} */}
          {/*  age={age} */}
          {/*  memberNumber={memberNumber} */}
          {/*  loading={loadingCurrentBalance} */}
          {/* /> */}
          {memberNumber !== null || (
            <span>
              <Message>account.non.member.statement</Message>{' '}
              <a className="btn btn-link p-0 border-0" href="https://tuleva.ee/tulundusyhistu/">
                <Message>login.join.tuleva</Message>
              </a>
            </span>
          )}{' '}
          <div>
            {secondPillarSourceFunds && secondPillarSourceFunds.length === 0 ? (
              <Message>account.second.pillar.missing</Message>
            ) : (
              ''
            )}
          </div>
        </div>

        {conversion && conversion.transfersComplete && conversion.selectionComplete ? (
          <div className="mt-5">
            <Message>account.converted.user.statement</Message>
          </div>
        ) : (
          ''
        )}
        {error ? <ErrorMessage errors={error.body} /> : ''}

        <div className="row mt-5">
          <div className="col-md-6 mb-4 lead">
            <Message>accountStatement.heading</Message>
          </div>
        </div>
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

        {thirdPillarSourceFunds && thirdPillarSourceFunds.length > 0 && (
          <>
            <div className="row">
              <div className="col-md-6 mb-2 mt-4">
                <Message className="mb-2 lead h5">accountStatement.thirdPillar.heading</Message>
              </div>
            </div>
            <AccountStatement funds={thirdPillarSourceFunds} />
          </>
        )}

        {pendingExchangesSection}
        <ReturnComparison token={token} />
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
        <div className="mt-5">
          <p className="mb-4 lead">
            <Message>update.user.details.title</Message>
          </p>
          <UpdateUserForm onSubmit={saveUser} />
        </div>
      </>
    );
  }
}

AccountPage.propTypes = {
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
  memberNumber: Types.number,
  conversion: Types.shape({
    transfersComplete: Types.bool,
    selectionComplete: Types.bool,
  }),
  saveUser: Types.func,
  error: Types.shape({
    body: Types.string,
  }),
};

AccountPage.defaultProps = {
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
  memberNumber: null,
  // age: null,
  conversion: {
    transfersComplete: false,
    selectionComplete: false,
  },
  error: null,
  saveUser: noop,
};

const mapStateToProps = state => ({
  secondPillarSourceFunds: state.exchange.sourceFunds,
  thirdPillarSourceFunds: state.thirdPillar.sourceFunds,
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
  memberNumber: (state.login.user || {}).memberNumber,
  conversion: state.login.userConversion,
  error: state.exchange.error,
  token: state.login.token,
});
const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      saveUser: updateUser,
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
