import React, { Fragment } from 'react';
import { PropTypes as Types } from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Message } from 'retranslate';
import { Link } from 'react-router';

import { Loader, ErrorMessage } from '../common';
import PensionFundTable from './../onboardingFlow/selectSources/pensionFundTable';
import PendingExchangesTable from './pendingExchangeTable';
import UpdateUserForm from './updateUserForm';
import { updateUser } from '../common/user/actions';

export const AccountPage = ({
  currentBalanceFunds,
  loadingCurrentBalance,
  initialCapital,
  memberNumber,
  conversion,
  pendingExchanges,
  loadingPendingExchanges,
  saveUser,
  error,
}) => (
  <Fragment>
    <div className="mt-5">
      {memberNumber ? (
        <Message params={{ memberNumber }}>account.member.statement</Message>
      ) : (
        <span>
          <Message>account.non.member.statement</Message>{' '}
          <a className="btn btn-link p-0 border-0" href="https://tuleva.ee/#inline-signup-anchor">
            <Message>login.join.tuleva</Message>
          </a>
        </span>
      )}{' '}
      {initialCapital ? (
        <Message params={{ initialCapital: initialCapital.amount }}>
          account.initial-capital.statement
        </Message>
      ) : (
        ''
      )}
      <div>
        {currentBalanceFunds && currentBalanceFunds.length === 0 ? (
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
      <div className="col-md-6">
        <Message className="mb-4 lead">select.sources.current.status</Message>
      </div>
      {currentBalanceFunds &&
        currentBalanceFunds.length > 0 && (
          <div className="col-md-6 text-md-right">
            <Link className="btn btn-primary mb-3" to="/steps/select-sources">
              <Message>change.my.pension.fund</Message>
            </Link>
          </div>
        )}
    </div>

    {loadingCurrentBalance ? (
      <Loader className="align-middle" />
    ) : (
      <PensionFundTable funds={currentBalanceFunds} />
    )}

    <div className="mt-5">
      <p className="mb-4 lead">
        <Message>pending.exchanges.lead</Message>
      </p>
      {loadingPendingExchanges ? (
        <Loader className="align-middle" />
      ) : (
        <PendingExchangesTable pendingExchanges={pendingExchanges} />
      )}
    </div>

    <div className="mt-5">
      <p className="mb-4 lead">
        <Message>update.user.details.title</Message>
      </p>
      <UpdateUserForm onSubmit={saveUser} />
    </div>
  </Fragment>
);

const noop = () => null;

AccountPage.defaultProps = {
  currentBalanceFunds: [],
  loadingCurrentBalance: false,
  pendingExchanges: [],
  loadingPendingExchanges: false,
  initialCapital: {},
  memberNumber: null,
  conversion: {},
  error: null,
  saveUser: noop,
};

AccountPage.propTypes = {
  currentBalanceFunds: Types.arrayOf(Types.shape({})),
  loadingCurrentBalance: Types.bool,
  pendingExchanges: Types.arrayOf(Types.shape({})),
  loadingPendingExchanges: Types.bool,
  initialCapital: Types.shape({}),
  memberNumber: Types.number,
  conversion: Types.shape({}),
  saveUser: Types.func,
  error: Types.shape({}),
};

const mapStateToProps = state => ({
  currentBalanceFunds: state.exchange.sourceFunds !== null ? state.exchange.sourceFunds : [],
  loadingCurrentBalance: state.exchange.loadingSourceFunds,
  pendingExchanges: state.exchange.pendingExchanges,
  loadingPendingExchanges: state.exchange.loadingPendingExchanges,
  initialCapital: state.account.initialCapital,
  memberNumber: (state.login.user || {}).memberNumber,
  conversion: state.login.userConversion,
  error: state.exchange.error,
});
const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      saveUser: updateUser,
    },
    dispatch,
  );

const withRedux = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default withRedux(AccountPage);
