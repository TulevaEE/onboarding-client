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
import FundTransferTable from './fundTransferTable';
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
  const selections2 = [];
  const clampBetweenOneAndZero = utils.createClamper(0, 1);
  Object
    .keys(routes)
    .forEach((sourceFundIsin) => {
      selections2[sourceFundIsin] = {
        sourceFund: { isin: sourceFundIsin },
        targetFunds: [],
      };
      Object
      .keys(routes[sourceFundIsin])
      .forEach((targetFundIsin) => {
        const percentage = clampBetweenOneAndZero(routes[sourceFundIsin][targetFundIsin]);
        if (percentage) { // we do not need to show empty rows.
          selections2[sourceFundIsin].targetFunds.push({
            isin: targetFundIsin,
            percentage,
          });
          selections.push({
            sourceFundIsin,
            targetFundIsin,
            percentage,
          });
        }
      });
    });

  const selectionList = [];
  Object.keys(selections2).forEach((key) => {
    selectionList.push(selections2[key]);
  });

//  return selections;
  return selectionList;
}

function aggregateSelections(selections) {
  // first, let's add up all the percentages
  const routes = joinDuplicateSelections(selections);
  // now, let's normalize the percentages and turn it back into a selection
  return normalizeAndGetSelections(routes);
}

/*
function attachNames(selections, sourceFunds) {
  return selections.map(selection => ({
    ...selection,
    sourceFundName: utils.findWhere(sourceFunds, ({ isin }) => (
      isin === selection.sourceFundIsin
    )).name,
  }));
}
*/

function findFundName(isin, sourceFunds) {
  const foundFund = sourceFunds.find(fund => fund.isin === isin);
  if (!foundFund) {
    return 'Unknown Name';
  }
  return foundFund.name;
  /*
  return utils.findWhere(sourceFunds, ({ fund }) => (
      fund.isin === isin
  )).name;
  */
}

function attachNames(selections, sourceFunds) {
  return selections.map((selection) => {
    const selectionWithNames = selection;
    selectionWithNames.sourceFund.name = findFundName(selection.sourceFund.isin, sourceFunds);
    selectionWithNames.targetFunds = selection.targetFunds.map(targetFund => ({
      ...targetFund,
      name: findFundName(targetFund.isin, sourceFunds),
    }));
    return selectionWithNames;
  });

/*
  return selections.map(selection => ({
    ...selection,
    sourceFundName: utils.findWhere(sourceFunds, ({ isin }) => (
        isin === selection.sourceFundIsin
    )).name,
  }));
*/
}

export const ConfirmMandate = ({
  exchange,
  onSignMandate,
  onCancelSigningMandate,
  onChangeAgreementToTerms,
}) => {
  if (exchange.loadingSourceFunds || exchange.loadingTargetFunds) {
    return <Loader className="align-middle" />;
  }
  const aggregatedSelections = aggregateSelections(exchange.sourceSelection);
  const aggregatedSelectionsWithNames = attachNames(aggregatedSelections, exchange.sourceFunds);

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
      <Message>confirm.mandate.intro</Message>
      {
        exchange.selectedFutureContributionsFundIsin ? (
          <div className="mt-4">
            <Message>confirm.mandate.future.contribution</Message>
            <b className="highlight">
              <Message>
                {`target.funds.${exchange.selectedFutureContributionsFundIsin}.title.into`}
              </Message>
            </b>
            {
              aggregatedSelections.length ? (
                <Message>confirm.mandate.and</Message>
              ) : ''
            }
          </div>
        ) : ''
      }
      {
        aggregatedSelections.length ? (
          <div className="mt-4">
            <Message>confirm.mandate.switch.sources</Message>
            <div className="mt-4">
              <FundTransferTable selections={aggregatedSelectionsWithNames} />
            </div>
          </div>
        ) : ''
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
          <div className="custom-control-description">
            <Message>confirm.mandate.agree.to.terms</Message>
            <div className="mt-2">
              <small className="text-muted">
                <a target="_blank" rel="noopener noreferrer" href="//www.pensionikeskus.ee/">
                  <Message>confirm.mandate.pension.centre</Message>
                </a>
                <Message>confirm.mandate.view.info</Message>
              </small>
            </div>
          </div>
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
  exchange: state.exchange,
});

const mapDispatchToProps = dispatch => bindActionCreators({
  onSignMandate: signMandate,
  onChangeAgreementToTerms: changeAgreementToTerms,
  onCancelSigningMandate: cancelSigningMandate,
}, dispatch);

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(ConfirmMandate);
