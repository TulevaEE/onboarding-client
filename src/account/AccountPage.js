import React, { PropTypes as Types } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Message } from 'retranslate';

import CurrentBalance from './currentBalance';

export const AccountPage = ({
                              currentBalanceFunds,
                              loadingCurrentBalanceFunds,
                              initialCapital,
}) => (
  <div>
    <div className="row mt-5">
      <div className="col">
        <CurrentBalance
          loading={loadingCurrentBalanceFunds}
          funds={currentBalanceFunds}
        />
      </div>
    </div>
    {/* TODO: any time work starts on every module, move to separate file and add tests. */}
    <div className="row">
      <div className="col">
        <h3 className="mt-5"><Message>account.active.fund.title</Message></h3>

        ACTIVE PENSION FUND WILL COME HERE
      </div>
    </div>
    {
      initialCapital ? (
        <div className="row">
          <div className="col">
            <h3 className="mt-5"><Message>account.initial.capital.title</Message></h3>
            {initialCapital.amount}
          </div>
        </div>) : ''
    }
    <div className="row">
      <div className="col">
        <h3 className="mt-5"><Message>account.tuleva.balance.title</Message></h3>
        <p><Message>account.tuleva.balance.subtitle</Message></p>
        TULEVA BALANCE WILL COME HERE
      </div>
    </div>
    <div className="row">
      <div className="col">
        <h3 className="mt-5"><Message>account.contact.info.title</Message></h3>
        CONTACT INFO WILL COME HERE
      </div>
    </div>
  </div>
);

AccountPage.defaultProps = {
  currentBalanceFunds: [],
  loadingCurrentBalanceFunds: false,
  initialCapital: null,
};

AccountPage.propTypes = {
  currentBalanceFunds: Types.arrayOf(Types.shape({})),
  loadingCurrentBalanceFunds: Types.bool,
  initialCapital: Types.number,
};

// TODO: write component
const mapStateToProps = state => ({
  currentBalanceFunds: state.exchange.sourceFunds,
  loadingCurrentBalanceFunds: state.exchange.loadingSourceFunds,
  initialCapital: state.account.initialCapital,
});
const mapDispatchToProps = dispatch => bindActionCreators({}, dispatch);

const withRedux = connect(mapStateToProps, mapDispatchToProps);

export default withRedux(AccountPage);
