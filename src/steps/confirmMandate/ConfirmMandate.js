import React, { PropTypes as Types } from 'react';
import { bindActionCreators } from 'redux';
import { Message } from 'retranslate';
import { Link } from 'react-router';
import { connect } from 'react-redux';

import { Loader, AuthenticationLoader, utils } from '../../common';

import { signMandate, cancelSigningMandate } from '../../exchange/actions';

import FundTransferMandate from './fundTransferMandate';
import './ConfirmMandate.scss';

function joinDuplicateSelections(selections) {
  return selections.reduce((currentRoutes, selection) => {
    const newCurrentRoutes = currentRoutes; // linter
    if (!newCurrentRoutes[selection.sourceFundIsin]) {
      newCurrentRoutes[selection.sourceFundIsin] = {};
    }
    if (!newCurrentRoutes[selection.sourceFundIsin][selection.targetFundIsin]) {
      newCurrentRoutes[selection.sourceFundIsin][selection.targetFundIsin] = 0;
    }
    newCurrentRoutes[selection.sourceFundIsin][selection.targetFundIsin] += selection.percentage;
    return newCurrentRoutes;
  }, {});
}

function normalizeAndGetSelections(routes) {
  const selections = [];
  const clampBetweenOneAndZero = utils.createClamper(0, 1);
  Object
    .keys(routes)
    .forEach(sourceFundIsin => Object
      .keys(routes[sourceFundIsin])
      .forEach((targetFundIsin) => {
        const percentage = clampBetweenOneAndZero(routes[sourceFundIsin][targetFundIsin]);
        if (percentage) { // we do not need to show empty rows.
          selections.push({
            sourceFundIsin,
            targetFundIsin,
            percentage,
          });
        }
      }));
  return selections;
}

function aggregateSelections(selections) {
  // first, let's add up all the percentages
  const routes = joinDuplicateSelections(selections);
  // now, let's normalize the percentages and turn it back into a selection
  return normalizeAndGetSelections(routes);
}

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
    fundTransferExchanges: exchange.sourceSelection.map(selection => ({
      amount: selection.percentage,
      sourceFundIsin: selection.sourceFundIsin,
      targetFundIsin: selection.targetFundIsin,
    })),
    futureContributionFundIsin: exchange.selectedTargetFund,
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
        exchange.selectedTargetFund ? (
          <div className="mt-4">
            <Message>confirm.mandate.transfer.pension</Message>
            <b className="highlight">
              <Message>
                {`target.funds.${exchange.selectedTargetFund}.title.into`}
              </Message>
            </b>.
          </div>
        ) : ''
      }
      {
        aggregateSelections(exchange.sourceSelection)
          .map((selection, index) =>
            <FundTransferMandate
              selection={{
                ...selection,
                sourceFundName: utils.findWhere(exchange.sourceFunds, ({ isin }) => (
                  isin === selection.sourceFundIsin
                )).name,
              }}
              key={index}
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
    sourceSelection: [],
    selectedTargetFund: null,
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
    sourceSelection: Types.arrayOf(Types.shape({})),
    selectedTargetFund: Types.string,
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
