import React, { PropTypes as Types } from 'react';
import { bindActionCreators } from 'redux';
import { Message } from 'retranslate';
import { Link } from 'react-router';
import { connect } from 'react-redux';

import { Loader, AuthenticationLoader, utils } from '../../common';

import {
  signMandate,
  cancelSigningMandate,
  changeAgreementToTerms,
} from '../../exchange/actions';

import MandateNotFilledAlert from './mandateNotFilledAlert';
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
  onChangeAgreementToTerms,
}) => {
  if (loadingUser || exchange.loadingSourceFunds || exchange.loadingTargetFunds) {
    return <Loader className="align-middle" />;
  }
  const aggregatedSelections = aggregateSelections(exchange.sourceSelection);
  const hasFilledFlow = aggregatedSelections.length || exchange.selectedFutureContributionsFundIsin;
  if (!hasFilledFlow) {
    return <MandateNotFilledAlert />;
  }
  const canSignMandate = exchange.agreedToTerms && hasFilledFlow;
  const startSigningMandate = () => canSignMandate && onSignMandate({
    fundTransferExchanges: exchange.sourceSelection.map(selection => ({
      amount: selection.percentage,
      sourceFundIsin: selection.sourceFundIsin,
      targetFundIsin: selection.targetFundIsin,
    })),
    futureContributionFundIsin: exchange.selectedFutureContributionsFundIsin,
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
        exchange.selectedFutureContributionsFundIsin ? (
          <div className="mt-4">
            <Message>confirm.mandate.transfer.pension</Message>
            <b className="highlight">
              <Message>
                {`target.funds.${exchange.selectedFutureContributionsFundIsin}.title.into`}
              </Message>
            </b>.
          </div>
        ) : ''
      }
      {
        aggregatedSelections.map((selection, index) =>
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
        <label className="custom-control custom-checkbox" htmlFor="agree-to-terms-checkbox">
          <input
            checked={exchange.agreedToTerms}
            onChange={() => onChangeAgreementToTerms(!exchange.agreedToTerms)}
            type="checkbox"
            className="custom-control-input"
            id="agree-to-terms-checkbox"
          />
          <span className="custom-control-indicator" />
          <span className="custom-control-description">
            <Message>confirm.mandate.agree.to.terms</Message>
          </span>
        </label>
      </div>
      <div className="mt-5">
        <button
          className="btn btn-primary mr-2"
          disabled={!canSignMandate}
          onClick={startSigningMandate}
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
    sourceSelection: [],
    selectedFutureContributionsFundIsin: null,
    agreedToTerms: false,
  },
  onSignMandate: noop,
  onCancelSigningMandate: noop,
  onChangeAgreementToTerms: noop,
};

ConfirmMandate.propTypes = {
  user: Types.shape({}),
  loadingUser: Types.bool,
  exchange: Types.shape({
    loadingSourceFunds: Types.bool,
    loadingTargetFunds: Types.bool,
    sourceSelection: Types.arrayOf(Types.shape({})),
    selectedFutureContributionsFundIsin: Types.string,
    agreedToTerms: Types.bool,
  }).isRequired,
  onSignMandate: Types.func,
  onCancelSigningMandate: Types.func,
  onChangeAgreementToTerms: Types.func,
};

const mapStateToProps = state => ({
  user: state.login.user || {},
  loadingUser: state.login.loadingUser,
  exchange: state.exchange,
});

const mapDispatchToProps = dispatch => bindActionCreators({
  onSignMandate: signMandate,
  onChangeAgreementToTerms: changeAgreementToTerms,
  onCancelSigningMandate: cancelSigningMandate,
}, dispatch);

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(ConfirmMandate);
