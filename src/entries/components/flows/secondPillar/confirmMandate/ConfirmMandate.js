import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { bindActionCreators } from 'redux';
import { Message } from 'retranslate';
import { connect } from 'react-redux';
import { Link, Redirect } from 'react-router-dom';

import { Loader, AuthenticationLoader, ErrorMessage, utils } from '../../../common';

import {
  previewMandate,
  signMandate,
  cancelSigningMandate,
  changeAgreementToTerms,
  closeErrorMessages,
} from '../../../exchange/actions';

import MandateNotFilledAlert from './mandateNotFilledAlert';
import FundTransferTable from './fundTransferTable';
import './ConfirmMandate.scss';
import { hasAddress as isAddressFilled } from '../../../common/user/address';

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
  Object.keys(routes).forEach(sourceFundIsin =>
    Object.keys(routes[sourceFundIsin]).forEach(targetFundIsin => {
      const percentage = clampBetweenOneAndZero(routes[sourceFundIsin][targetFundIsin]);
      if (percentage) {
        // we do not need to show empty rows.
        selections.push({
          sourceFundIsin,
          targetFundIsin,
          percentage,
        });
      }
    }),
  );
  return selections;
}

function aggregateSelections(selections) {
  // first, let's add up all the percentages
  const routes = joinDuplicateSelections(selections);
  // now, let's normalize the percentages and turn it back into a selection
  return normalizeAndGetSelections(routes);
}

function attachNames(selections, sourceFunds, targetFunds) {
  return selections.map(selection => ({
    ...selection,
    sourceFundName: (
      utils.findWhere(sourceFunds, ({ isin }) => isin === selection.sourceFundIsin) || {}
    ).name,
    targetFundName: (
      utils.findWhere(targetFunds, ({ isin }) => isin === selection.targetFundIsin) || {}
    ).name,
  }));
}

function isFundPriceZero(sourceFunds, isinToMatch) {
  return utils.findWhere(sourceFunds, ({ isin }) => isin === isinToMatch).price === 0;
}

function getMandate(exchange, address) {
  return {
    fundTransferExchanges: exchange.sourceSelection
      .filter(selection => isFundPriceZero(exchange.sourceFunds, selection.sourceFundIsin) !== true)
      .map(selection => ({
        amount: selection.percentage,
        sourceFundIsin: selection.sourceFundIsin,
        targetFundIsin: selection.targetFundIsin,
      })),
    futureContributionFundIsin: exchange.selectedFutureContributionsFundIsin,
    address,
  };
}

export const ConfirmMandate = ({
  exchange,
  selectedFutureContributionsFund,
  address,
  hasAddress,
  loading,
  previousPath,
  onPreviewMandate,
  onSignMandate,
  onCancelSigningMandate,
  onChangeAgreementToTerms,
  onCloseErrorMessages,
}) => {
  if (loading) {
    return <Loader className="align-middle" />;
  }
  if (exchange.error) {
    return <ErrorMessage errors={exchange.error.body} onCancel={onCloseErrorMessages} overlayed />;
  }
  const aggregatedSelections = aggregateSelections(
    exchange.sourceSelection.filter(
      selection => isFundPriceZero(exchange.sourceFunds, selection.sourceFundIsin) !== true,
    ),
  );
  const aggregatedSelectionsWithNames = attachNames(
    aggregatedSelections,
    exchange.sourceFunds,
    exchange.targetFunds,
  );
  const hasFilledFlow = aggregatedSelections.length || exchange.selectedFutureContributionsFundIsin;
  if (!hasFilledFlow) {
    return <MandateNotFilledAlert />;
  }
  const canSignMandate = exchange.agreedToTerms && hasFilledFlow;
  // TODO: extract into a function
  const startPreviewMandate = () => {
    onPreviewMandate(getMandate(exchange, address));
  };
  const startSigningMandate = () => canSignMandate && onSignMandate(getMandate(exchange, address));
  return (
    <div className="px-col">
      {!hasAddress && <Redirect to={previousPath} />}

      {exchange.loadingMandate || exchange.mandateSigningControlCode ? (
        <AuthenticationLoader
          controlCode={exchange.mandateSigningControlCode}
          onCancel={onCancelSigningMandate}
          overlayed
        />
      ) : (
        ''
      )}

      <Message>confirm.mandate.intro</Message>
      {exchange.selectedFutureContributionsFundIsin ? (
        <div className="mt-4">
          <Message>confirm.mandate.future.contribution</Message>
          <b className="highlight">{selectedFutureContributionsFund.name}</b>
        </div>
      ) : (
        ''
      )}
      {aggregatedSelections.length ? (
        <div className="mt-4">
          <Message>confirm.mandate.switch.sources</Message>
          <div className="mt-4">
            <FundTransferTable selections={aggregatedSelectionsWithNames} />
          </div>
        </div>
      ) : (
        ''
      )}
      <div className="mt-5">
        <div className="custom-control custom-checkbox">
          <input
            checked={exchange.agreedToTerms}
            onChange={() => onChangeAgreementToTerms(!exchange.agreedToTerms)}
            type="checkbox"
            className="custom-control-input"
            id="agree-to-terms-checkbox"
          />
          <label className="custom-control-label" htmlFor="agree-to-terms-checkbox">
            <Message>confirm.mandate.agree.to.terms</Message>
            <div className="mt-2">
              <small className="text-muted">
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="//www.pensionikeskus.ee/ii-sammas/kohustuslikud-pensionifondid/fonditasude-vordlus/"
                >
                  <Message>confirm.mandate.pension.centre</Message>
                </a>
                <Message>confirm.mandate.view.info</Message>
              </small>
            </div>
          </label>
        </div>
      </div>
      {exchange.mandateSigningError ? (
        <ErrorMessage
          errors={exchange.mandateSigningError.body}
          onCancel={onCloseErrorMessages}
          overlayed
        />
      ) : (
        ''
      )}
      <div className="mt-5">
        <button
          type="button"
          id="sign"
          className="btn btn-primary mb-2 mr-2"
          disabled={!canSignMandate}
          onClick={startSigningMandate}
        >
          <Message>confirm.mandate.sign</Message>
        </button>
        <button
          type="button"
          id="preview"
          className="btn btn-secondary mb-2 mr-2"
          onClick={startPreviewMandate}
        >
          <Message>confirm.mandate.preview</Message>
        </button>
        <Link to="/2nd-pillar-flow">
          <button type="button" className="btn btn-secondary mb-2">
            <Message>steps.previous</Message>
          </button>
        </Link>
      </div>
    </div>
  );
};

const noop = () => null;

ConfirmMandate.defaultProps = {
  loading: false,
  selectedFutureContributionsFund: {},
  address: {},
  hasAddress: false,
  onPreviewMandate: noop,
  onSignMandate: noop,
  onCancelSigningMandate: noop,
  onChangeAgreementToTerms: noop,
  onCloseErrorMessages: noop,
};

ConfirmMandate.propTypes = {
  exchange: Types.shape({
    error: Types.shape({ body: Types.string }),
    loadingSourceFunds: Types.bool,
    loadingTargetFunds: Types.bool,
    sourceFunds: Types.arrayOf(Types.shape({})),
    targetFunds: Types.arrayOf(Types.shape({})),
    sourceSelection: Types.arrayOf(Types.shape({})),
    selectedFutureContributionsFundIsin: Types.string,
    loadingMandate: Types.bool,
    mandateSigningControlCode: Types.string,
    mandateSigningError: Types.shape({ body: Types.string }),
    agreedToTerms: Types.bool,
  }).isRequired,
  selectedFutureContributionsFund: Types.shape({
    isin: Types.string,
    name: Types.string,
  }),
  address: Types.shape({}),
  hasAddress: Types.bool,
  loading: Types.bool,
  onPreviewMandate: Types.func,
  onSignMandate: Types.func,
  onCancelSigningMandate: Types.func,
  onChangeAgreementToTerms: Types.func,
  onCloseErrorMessages: Types.func,
};

const mapStateToProps = state => ({
  exchange: state.exchange,
  selectedFutureContributionsFund: (state.exchange.targetFunds || []).find(
    fund => fund.isin === state.exchange.selectedFutureContributionsFundIsin,
  ),
  address: (state.login.user || {}).address,
  hasAddress: !state.login.user || isAddressFilled(state.login.user),
  loading:
    state.login.loadingUser ||
    state.login.loadingUserConversion ||
    state.exchange.loadingSourceFunds ||
    state.exchange.loadingTargetFunds,
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      onPreviewMandate: previewMandate,
      onSignMandate: signMandate,
      onChangeAgreementToTerms: changeAgreementToTerms,
      onCancelSigningMandate: cancelSigningMandate,
      onCloseErrorMessages: closeErrorMessages,
    },
    dispatch,
  );

const connectToRedux = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default connectToRedux(ConfirmMandate);
