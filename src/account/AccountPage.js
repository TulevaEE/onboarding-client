import React, { PropTypes as Types } from 'react';
import { bindActionCreators } from 'redux';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { Message } from 'retranslate';

import { Loader } from '../common';
import PensionFundTable from './../onboardingFlow/selectSources/pensionFundTable';

export const AccountPage = ({
                              currentBalanceFunds,
                              loadingCurrentBalance,
                              initialCapital,
                              memberNumber,
                              conversion,
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
        {
          loadingCurrentBalance ?
            <Loader className="align-middle" /> :
            <PensionFundTable funds={currentBalanceFunds} />
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
  initialCapital: null,
  memberNumber: null,
  conversion: null,
};

AccountPage.propTypes = {
  currentBalanceFunds: Types.arrayOf(Types.shape({})),
  loadingCurrentBalance: Types.bool,
  initialCapital: Types.shape({}),
  memberNumber: Types.number,
  conversion: Types.shape({}),
};

// TODO: write component
const mapStateToProps = state => ({
  currentBalanceFunds: state.exchange.sourceFunds,
  loadingCurrentBalance: state.exchange.loadingSourceFunds,
  initialCapital: state.account.initialCapital,
  memberNumber: (state.login.user || {}).memberNumber,
  conversion: state.login.conversion,
});
const mapDispatchToProps = dispatch => bindActionCreators({}, dispatch);

const withRedux = connect(mapStateToProps, mapDispatchToProps);

export default withRedux(AccountPage);
