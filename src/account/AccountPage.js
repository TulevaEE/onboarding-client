import React, { PropTypes as Types } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Message } from 'retranslate';

import PensionFundTable from './../onboardingFlow/selectSources/pensionFundTable';

export const AccountPage = ({
                              currentBalanceFunds,
                              initialCapital,
                              memberNumber,
                              conversion,
}) => (
  <div>
    <div className="row mt-5">
      <div className="col">
        <Message params={{ memberNumber }}>account.member.statement</Message>
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
        <PensionFundTable funds={currentBalanceFunds} />
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
  initialCapital: null,
  memberNumber: null,
  conversion: null,
};

AccountPage.propTypes = {
  currentBalanceFunds: Types.arrayOf(Types.shape({})),
  initialCapital: Types.shape({}),
  memberNumber: Types.number,
  conversion: Types.shape({}),
};

// TODO: write component
const mapStateToProps = state => ({
  currentBalanceFunds: state.exchange.sourceFunds,
  initialCapital: state.account.initialCapital,
  memberNumber: state.login.user.memberNumber,
  conversion: state.login.conversion,
});
const mapDispatchToProps = dispatch => bindActionCreators({}, dispatch);

const withRedux = connect(mapStateToProps, mapDispatchToProps);

export default withRedux(AccountPage);
