import React, { PropTypes as Types } from 'react';
import { bindActionCreators } from 'redux';
import { Message } from 'retranslate';
import { Link } from 'react-router';
import { connect } from 'react-redux';

import { Loader, AuthenticationLoader } from '../../common';

import { signMandate } from '../../exchange/actions';

import './ConfirmMandate.scss';

// TODO: write tests after demo
const ConfirmMandate = ({ user, loadingUser, exchange, onSignMandate }) => {
  if (loadingUser || exchange.loadingSourceFunds || exchange.loadingTargetFunds) {
    return <Loader className="align-middle" />;
  } else if (exchange.loadingMandate || exchange.mandateSigningControlCode) {
    return <AuthenticationLoader controlCode={exchange.mandateSigningControlCode} />;
  } else if (exchange.mandateSigningSuccessful) {
    return (
      <div
        className="alert alert-success text-center pt-5 pb-5" style={{
          backgroundColor: 'rgba(11, 250, 67, 0.08)',
          border: 'solid 2px #51c26c',
          borderRadius: '8px',
        }}
      >
        <h2 className="text-center">Avaldus esitatud</h2>
        <p className="mt-4">
          Sinu maksed suunatakse Tuleva pensionifondi alates järgmisest maksest.
        </p>
        <p>Sinu olemasolevad osakud vahetatakse Tuleva pensionifondi osakute vastu 1. mail 2017.</p>
      </div>
    );
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
            <b className="highlight">
              <Message>
                {`target.funds.${exchange.selectedTargetFund.isin}.title.into`}
              </Message>
            </b>.
          </div>
        ) : ''
      }
      {
        exchange.sourceSelection.map(fund => (
          <div className="mt-4" key={fund.isin}>
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
            <b className="highlight">
              <Message>
                {`target.funds.${exchange.selectedTargetFund.isin}.title`}
              </Message>
            </b>
            <Message>confirm.mandate.for.shares</Message>
          </div>
        ))
      }
      <div className="mt-5">
        <button
          className="btn btn-primary mr-2"
          onClick={() => onSignMandate({
            fundTransferExchanges: exchange.sourceSelection.map(fund => ({
              amount: fund.percentage,
              sourceFundIsin: fund.isin,
              targetFundIsin: exchange.selectedTargetFund.isin,
            })),
            futureContributionFundIsin: exchange.transferFutureCapital ?
              exchange.selectedTargetFund.isin : null,
          })}
        >
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
};

const mapStateToProps = state => ({
  user: state.login.user,
  loadingUser: state.login.loadingUser,
  exchange: state.exchange,
});

const mapDispatchToProps = dispatch => bindActionCreators({
  onSignMandate: signMandate,
}, dispatch);

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(ConfirmMandate);
