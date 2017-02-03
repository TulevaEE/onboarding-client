import React, { PropTypes as Types } from 'react';
import { Message } from 'retranslate';
import { connect } from 'react-redux';

import { Loader } from '../../common';

const ConfirmApplication = ({ user, loadingUser, exchange }) => {
  if (loadingUser || exchange.loadingSourceFunds || exchange.loadingTargetFunds) {
    return <Loader className="align-middle" />;
  }
  return (
    <div className="px-col">
      <Message>confirm.mandate.me</Message><b>{user.firstName} {user.lastName}</b>
      <Message>confirm.mandate.idcode</Message><b>{user.personalCode}</b>
      <Message>confirm.mandate.change.mandate</Message>
      {
        exchange.transferFutureCapital ? (
          <div className="mt-4">
            <Message>confirm.mandate.transfer.pension</Message>
            <b>
              <Message>
                {`target.funds.${exchange.selectedTargetFund.isin}.title.into`}
              </Message>
            </b>.
          </div>
        ) : ''
      }
      {
        exchange.sourceSelection.map(fund => (
          <div className="mt-4">
            <Message>confirm.mandate.switch</Message>
            <b>
              {
                fund.percentage === 1 ?
                  <Message>confirm.mandate.amounts.all</Message> :
                  `${fund.percentage * 100}%`
              }
            </b>
            <Message>confirm.mandate.under.my.control</Message>
            <b>{fund.name}</b>
            <Message>confirm.mandate.shares</Message>
            <b>
              <Message>
                {`target.funds.${exchange.selectedTargetFund.isin}.title`}
              </Message>
            </b>
            <Message>confirm.mandate.for.shares</Message>
          </div>
        ))
      }
    </div>
  );
};

ConfirmApplication.defaultProps = {
  user: {},
  loadingUser: false,
  exchange: {
    loadingSourceFunds: false,
    loadingTargetFunds: false,
    transferFutureCapital: true,
    sourceSelection: [],
    selectedTargetFund: {},
  },
};

ConfirmApplication.propTypes = {
  user: Types.shape({}),
  loadingUser: Types.bool,
  exchange: Types.shape({
    loadingSourceFunds: Types.bool,
    loadingTargetFunds: Types.bool,
    transferFutureCapital: Types.bool,
    sourceSelection: Types.arrayOf(Types.shape({})),
    selectedTargetFund: Types.shape({ isin: Types.string }),
  }).isRequired,
};

const mapStateToProps = state => ({
  user: state.login.user,
  loadingUser: state.login.loadingUser,
  exchange: state.exchange,
});

const connectToRedux = connect(mapStateToProps);

export default connectToRedux(ConfirmApplication);
