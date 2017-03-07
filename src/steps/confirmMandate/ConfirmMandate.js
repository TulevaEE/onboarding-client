import React, { PropTypes as Types } from 'react';
import { bindActionCreators } from 'redux';
import { Message } from 'retranslate';
import { Link } from 'react-router';
import { connect } from 'react-redux';

import { Loader, AuthenticationLoader } from '../../common';

import { signMandate, cancelSigningMandate } from '../../exchange/actions';

import FundTransferMandate from './fundTransferMandate';
import './ConfirmMandate.scss';

// TODO: write tests after demo
export const ConfirmMandate = ({
  user,
  loadingUser,
  exchange,
  onSignMandate,
  onCancelSigningMandate,
}) => {
  if (loadingUser || exchange.loadingSourceFunds || exchange.loadingTargetFunds) {
    return <Loader className="align-middle" />;
  }
  const startSigningMandate = () => onSignMandate({
    fundTransferExchanges: exchange.sourceSelection.map(fund => ({
      amount: fund.percentage,
      sourceFundIsin: fund.isin,
      targetFundIsin: exchange.selectedTargetFund.isin,
    })),
    futureContributionFundIsin: exchange.transferFutureCapital ?
      exchange.selectedTargetFund.isin : null,
  });
  return (
    <div className="px-col">
      {
        exchange.loadingMandate || exchange.mandateSigningControlCode ?
          <AuthenticationLoader
            controlCode={exchange.mandateSigningControlCode}
            onCancel={onCancelSigningMandate}
            overlayed
          /> : ''
      }
      <Message>confirm.mandate.me</Message><b>{user.firstName} {user.lastName}</b>
      <Message>confirm.mandate.idcode</Message><b>{user.personalCode}</b>
      <Message>confirm.mandate.change.mandate</Message>
      {
        exchange.transferFutureCapital ? (
          <div className="mt-4">
            <Message>confirm.mandate.transfer.pension</Message>
            <b className="highlight">
              <Message>
                {`target.funds.${exchange.selectedTargetFund.isin}.title.into`}
              </Message>
            </b>.
          </div>
        ) : ''
      }
      {
        exchange
          .sourceSelection
          .filter(selection => !!selection.percentage)
          .map(fund =>
            <FundTransferMandate
              fund={fund}
              targetFund={exchange.selectedTargetFund}
              key={fund.isin}
            />,
          )
      }
      <div className="mt-5">
        <button className="btn btn-primary mr-2" onClick={startSigningMandate}>
          <Message>confirm.mandate.sign</Message>
        </button>
        <Link className="btn btn-secondary" to="/steps/transfer-future-capital">
          <Message>steps.previous</Message>
        </Link>
      </div>
    </div>
  );
};

const noop = () => null;

ConfirmMandate.defaultProps = {
  user: {},
  loadingUser: false,
  exchange: {
    loadingSourceFunds: false,
    loadingTargetFunds: false,
    transferFutureCapital: true,
    sourceSelection: [],
    selectedTargetFund: {},
  },
  onSignMandate: noop,
  onCancelSigningMandate: noop,
};

ConfirmMandate.propTypes = {
  user: Types.shape({}),
  loadingUser: Types.bool,
  exchange: Types.shape({
    loadingSourceFunds: Types.bool,
    loadingTargetFunds: Types.bool,
    transferFutureCapital: Types.bool,
    sourceSelection: Types.arrayOf(Types.shape({})),
    selectedTargetFund: Types.shape({ isin: Types.string }),
  }).isRequired,
  onSignMandate: Types.func,
  onCancelSigningMandate: Types.func,
};

const mapStateToProps = state => ({
  user: state.login.user || {},
  loadingUser: state.login.loadingUser,
  exchange: state.exchange,
});

const mapDispatchToProps = dispatch => bindActionCreators({
  onSignMandate: signMandate,
  onCancelSigningMandate: cancelSigningMandate,
}, dispatch);

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(ConfirmMandate);
