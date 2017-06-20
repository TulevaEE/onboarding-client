import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { bindActionCreators } from 'redux';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { Message } from 'retranslate';

import { Loader } from '../common';
import PensionFundTable from './../onboardingFlow/selectSources/pensionFundTable';
import PendingExchangesTable from './pendingExchangeTable';

export const AccountPage = ({
                              currentBalanceFunds,
                              loadingCurrentBalance,
                              initialCapital,
                              memberNumber,
                              conversion,
                              pendingExchanges,
                              loadingPendingExchanges,
}) => (
  <div>
    <div className="row mt-5">
      <div className="col">
        { memberNumber ?
          <Message params={{ memberNumber }}>account.member.statement</Message> :
          (
            <span>
              <Message>account.non.member.statement</Message>
              { ' ' }
              <Link className="btn btn-link p-0 border-0" to="/steps/new-user">
                <Message>login.join.tuleva</Message>
              </Link>
            </span>
          )
        }
        { ' ' }
        {
          initialCapital ? (
            <Message params={{ initialCapital: initialCapital.amount }}>
              account.initial-capital.statement
            </Message>) : ''
        }
      </div>
    </div>
    {
      conversion && conversion.transfersComplete && conversion.selectionComplete ? (
        <div className="row mt-5">
          <div className="col">
            <Message>account.converted.user.statement</Message>
          </div>
        </div>
      ) : ''
    }
    <div className="row mt-5">
      <div className="col">
        <p className="mb-4 lead"><Message>select.sources.current.status</Message></p>
        {
          loadingCurrentBalance ?
            <Loader className="align-middle" /> :
            <PensionFundTable funds={currentBalanceFunds} />
        }
      </div>
    </div>
    <div className="row mt-5">
      <div className="col">
        <p className="mb-4 lead"><Message>pending.exchanges.lead</Message></p>
        {
          loadingPendingExchanges ?
            <Loader className="align-middle" /> :
            <PendingExchangesTable pendingExchanges={pendingExchanges} />
        }
      </div>
    </div>
    { /*
      <div className="row">
        <div className="col">
          <h3 className="mt-5"><Message>account.contact.info.title</Message></h3>
          CONTACT INFO WILL COME HERE
        </div>
      </div>
    */ }
  </div>
);

AccountPage.defaultProps = {
  currentBalanceFunds: [],
  loadingCurrentBalance: false,
  pendingExchanges: [],
  loadingPendingExchanges: false,
  initialCapital: {},
  memberNumber: null,
  conversion: {},
};

AccountPage.propTypes = {
  currentBalanceFunds: Types.arrayOf(Types.shape({})),
  loadingCurrentBalance: Types.bool,
  pendingExchanges: Types.arrayOf(Types.shape({})),
  loadingPendingExchanges: Types.bool,
  initialCapital: Types.shape({}),
  memberNumber: Types.number,
  conversion: Types.shape({}),
};

// TODO: write component
const mapStateToProps = state => ({
  currentBalanceFunds: state.exchange.sourceFunds,
  loadingCurrentBalance: state.exchange.loadingSourceFunds,
  pendingExchanges: state.exchange.pendingExchanges,
  loadingPendingExchanges: state.exchange.loadingPendingExchanges,
  initialCapital: state.account.initialCapital,
  memberNumber: (state.login.user || {}).memberNumber,
  conversion: state.login.conversion,
});
const mapDispatchToProps = dispatch => bindActionCreators({}, dispatch);

const withRedux = connect(mapStateToProps, mapDispatchToProps);

export default withRedux(AccountPage);
