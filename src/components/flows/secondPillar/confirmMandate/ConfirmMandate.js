import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link, Redirect } from 'react-router-dom';

import { FormattedMessage } from 'react-intl';
import { AuthenticationLoader, ErrorMessage, Loader, utils } from '../../../common';

import {
  cancelSigningMandate,
  changeAgreementToTerms,
  closeErrorMessages,
  previewMandate,
  signMandate,
} from '../../../exchange/actions';

import MandateNotFilledAlert from './mandateNotFilledAlert';
import { FundTransferTable } from './fundTransferTable/FundTransferTable';
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
  Object.keys(routes).forEach((sourceFundIsin) =>
    Object.keys(routes[sourceFundIsin]).forEach((targetFundIsin) => {
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

function removeSameFundTransfers(normalized) {
  return normalized.filter((selection) => selection.sourceFundIsin !== selection.targetFundIsin);
}

function aggregateSelections(selections) {
  // first, let's add up all the percentages
  const routes = joinDuplicateSelections(selections);
  // now, let's normalize the percentages and turn it back into a selection
  const normalized = normalizeAndGetSelections(routes);
  return removeSameFundTransfers(normalized);
}

function attachNames(selections, sourceFunds, targetFunds) {
  return selections.map((selection) => ({
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

function getMandate(aggregatedSelections, selectedFutureContributionsFund, address) {
  return {
    fundTransferExchanges: aggregatedSelections.map((selection) => ({
      amount: selection.percentage,
      sourceFundIsin: selection.sourceFundIsin,
      targetFundIsin: selection.targetFundIsin,
    })),
    futureContributionFundIsin: selectedFutureContributionsFund
      ? selectedFutureContributionsFund.isin
      : null,
    address,
  };
}

export const ConfirmMandate = ({
  exchange,
  selectedFutureContributionsFund,
  address,
  hasAddress,
  signedMandateId,
  nextPath,
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
      (selection) => isFundPriceZero(exchange.sourceFunds, selection.sourceFundIsin) !== true,
    ),
  );
  const aggregatedSelectionsWithNames = attachNames(
    aggregatedSelections,
    exchange.sourceFunds,
    exchange.targetFunds,
  );
  const hasFilledFlow = !!aggregatedSelections.length || !!selectedFutureContributionsFund;
  if (!hasFilledFlow) {
    return <MandateNotFilledAlert />;
  }
  const canSignMandate = exchange.agreedToTerms && hasFilledFlow;
  // TODO: extract into a function
  const startPreviewMandate = () => {
    const mandate = getMandate(aggregatedSelections, selectedFutureContributionsFund, address);
    onPreviewMandate(mandate);
  };
  const startSigningMandate = () =>
    canSignMandate &&
    onSignMandate(getMandate(aggregatedSelections, selectedFutureContributionsFund, address));
  return (
    <>
      {!hasAddress && <Redirect to={previousPath} />}
      {signedMandateId && <Redirect to={nextPath} />}

      {exchange.loadingMandate || exchange.mandateSigningControlCode ? (
        <AuthenticationLoader
          controlCode={exchange.mandateSigningControlCode}
          onCancel={onCancelSigningMandate}
          overlayed
        />
      ) : (
        ''
      )}

      <FormattedMessage id="confirm.mandate.intro" />
      {aggregatedSelections.length ? (
        <div className="mt-4">
          <FundTransferTable selections={aggregatedSelectionsWithNames} />
        </div>
      ) : (
        ''
      )}
      {selectedFutureContributionsFund ? (
        <div className="mt-2 p-3 fund-selections-container d-flex flex-column justify-content-between">
          <FormattedMessage id="confirm.mandate.future.contribution" />
          <b>
            <span className="highlight">{selectedFutureContributionsFund.name}</span>
          </b>
        </div>
      ) : (
        ''
      )}

      <div className="mt-5">
        <div className="form-check">
          <input
            checked={exchange.agreedToTerms}
            onChange={() => onChangeAgreementToTerms(!exchange.agreedToTerms)}
            type="checkbox"
            className="form-check-input"
            id="agree-to-terms-checkbox"
          />
          <label className="form-check-label" htmlFor="agree-to-terms-checkbox">
            <FormattedMessage id="confirm.mandate.agree.to.terms" />
            <div className="mt-2">
              <small className="text-body-secondary">
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="//www.pensionikeskus.ee/ii-sammas/kohustuslikud-pensionifondid/fonditasude-vordlus/"
                >
                  <FormattedMessage id="confirm.mandate.pension.centre" />
                </a>
                <FormattedMessage id="confirm.mandate.view.info" />
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
      <div className="mt-5 d-flex flex-wrap align-items-center gap-2">
        <button
          type="button"
          id="sign"
          className="btn btn-primary"
          disabled={!canSignMandate}
          onClick={startSigningMandate}
        >
          <FormattedMessage id="confirm.mandate.sign" />
        </button>
        <button
          type="button"
          id="preview"
          className="btn btn-outline-primary"
          onClick={startPreviewMandate}
        >
          <FormattedMessage id="confirm.mandate.preview" />
        </button>
        <Link className="btn btn-outline-primary" to="/2nd-pillar-flow/select-sources">
          <FormattedMessage id="confirm.mandate.back" />
        </Link>
      </div>
    </>
  );
};

const noop = () => null;

ConfirmMandate.defaultProps = {
  loading: false,
  selectedFutureContributionsFund: null,
  address: {},
  hasAddress: false,
  signedMandateId: null,
  nextPath: '',
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
  signedMandateId: Types.number,
  nextPath: Types.string,
  loading: Types.bool,
  onPreviewMandate: Types.func,
  onSignMandate: Types.func,
  onCancelSigningMandate: Types.func,
  onChangeAgreementToTerms: Types.func,
  onCloseErrorMessages: Types.func,
};

const mapStateToProps = (state) => {
  const activeFundIsin = (state.exchange.sourceFunds || []).reduce(
    (acc, fund) => (fund.activeFund ? fund.isin : acc),
    '',
  );

  const selectedFutureContributionsFund = (state.exchange.targetFunds || []).find(
    (targetFund) =>
      targetFund.isin === state.exchange.selectedFutureContributionsFundIsin &&
      targetFund.isin !== activeFundIsin,
  );

  return {
    exchange: state.exchange,
    selectedFutureContributionsFund,
    address: (state.login.user || {}).address,
    hasAddress: !state.login.user || isAddressFilled(state.login.user),
    signedMandateId: state.exchange.signedMandateId,
    loading:
      state.login.loadingUser ||
      state.login.loadingUserConversion ||
      state.exchange.loadingSourceFunds ||
      state.exchange.loadingTargetFunds,
  };
};

const mapDispatchToProps = (dispatch) =>
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

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(ConfirmMandate);
