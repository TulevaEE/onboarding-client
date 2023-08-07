import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { Link, Redirect } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { selectExchangeSources } from '../../../exchange/actions';
import { ErrorMessage, Loader, Radio } from '../../../common';
import TargetFundSelector from './targetFundSelector';
import ExactFundSelector from './exactFundSelector';
import { isTuleva } from '../../../common/utils';
import AccountStatement from '../../../account/AccountStatement';
import { useMandateDeadlines } from '../../../common/apiHooks';
import { formatDate } from '../../../common/dateUtils';

function selectAllWithTarget(sourceFunds, targetFund) {
  return sourceFunds
    .filter((fund, index, list) => list.length === 1 || fund.isin !== targetFund.isin)
    .map((fund) => ({
      sourceFundIsin: fund.isin,
      targetFundIsin: targetFund.isin,
      percentage: 1,
    }));
}

function selectionsError(selections) {
  const sourceFundPercentages = {};
  let errorDescriptionCode = null;
  selections.forEach((selection) => {
    if (!sourceFundPercentages[selection.sourceFundIsin]) {
      sourceFundPercentages[selection.sourceFundIsin] = 0;
    }
    sourceFundPercentages[selection.sourceFundIsin] += selection.percentage;
    if (sourceFundPercentages[selection.sourceFundIsin] > 1) {
      errorDescriptionCode = 'select.sources.error.source.fund.percentages.over.100';
    }

    if (selection.sourceFundIsin === selection.targetFundIsin) {
      errorDescriptionCode = 'select.sources.error.source.fund.is.target.fund';
    }
  });

  return errorDescriptionCode;
}

export const SelectSources = ({
  recommendedFundIsin,
  loadingSourceFunds,
  loadingTargetFunds,
  sourceFunds,
  targetFunds,
  sourceSelection,
  onSelect,
  sourceSelectionExact,
  error,
  nextPath,
}) => {
  const { data: mandateDeadlines } = useMandateDeadlines();

  if (error) {
    return <ErrorMessage errors={error.body} />;
  }
  if (loadingSourceFunds || loadingTargetFunds) {
    return <Loader className="align-middle" />;
  }
  const fullSelectionActive = !!sourceSelection.length && !sourceSelectionExact;
  const noneSelectionActive = !sourceSelection.length && !sourceSelectionExact;
  const validationErrorCode = selectionsError(sourceSelection);
  const isValid = !validationErrorCode;
  const tulevaTargetFunds =
    targetFunds && targetFunds.length && targetFunds.filter((fund) => isTuleva(fund));
  const defaultTargetFund =
    tulevaTargetFunds && tulevaTargetFunds.length ? tulevaTargetFunds[0] : null;

  function validationSelectionErrorElement(errorCode) {
    if (!errorCode) {
      return null;
    }
    return (
      <div className="text-danger mt-3">
        <FormattedMessage id={errorCode} />
      </div>
    );
  }

  return (
    <div>
      {sourceFunds && !sourceFunds.length && <Redirect to={nextPath} />}
      <div className="row justify-content-around align-items-center">
        <div className="col-12">
          <div className="px-col mb-4">
            <p className="mb-4 lead">
              <FormattedMessage id="select.sources.current.status" />
            </p>
            <AccountStatement funds={sourceFunds} />
          </div>
        </div>
      </div>
      <Radio
        name="tv-select-sources-type"
        id="tv-select-sources-type-all"
        selected={fullSelectionActive}
        onSelect={() => onSelect(selectAllWithTarget(sourceFunds, defaultTargetFund), false)}
      >
        <h3 className="m-0">
          <FormattedMessage id="select.sources.select.all" />
        </h3>
        {fullSelectionActive ? (
          <div className="mt-3">
            <FormattedMessage id="select.sources.select.all.subtitle" />{' '}
            {mandateDeadlines && (
              <FormattedMessage
                id="select.sources.select.all.deadline"
                values={{
                  periodEnding: formatDate(mandateDeadlines.periodEnding),
                  b: (chunks) => <b className="text-nowrap">{chunks}</b>,
                }}
              />
            )}
            <div className="mt-4">
              <FormattedMessage id="select.sources.select.all.choose" className="pt-2" />
            </div>
            <TargetFundSelector
              targetFunds={tulevaTargetFunds}
              onSelectFund={(targetFund) =>
                onSelect(selectAllWithTarget(sourceFunds, targetFund), false)
              }
              selectedTargetFundIsin={sourceSelection[0].targetFundIsin}
              recommendedFundIsin={recommendedFundIsin}
            />
          </div>
        ) : (
          ''
        )}
      </Radio>
      <Radio
        name="tv-select-sources-type"
        id="tv-select-sources-type-some"
        className="mt-3"
        selected={sourceSelectionExact}
        onSelect={() => onSelect(sourceSelection, true)}
      >
        <h3 className="m-0">
          <FormattedMessage id="select.sources.select.some" />
        </h3>
        {sourceSelectionExact ? (
          <div className="mt-3">
            <FormattedMessage id="select.sources.select.some.subtitle" />
            <ExactFundSelector
              selections={sourceSelection}
              sourceFunds={sourceFunds}
              targetFunds={targetFunds}
              onChange={(selection) => onSelect(selection, true)}
            />
          </div>
        ) : (
          ''
        )}
      </Radio>
      <Radio
        name="tv-select-sources-type"
        id="tv-select-sources-type-none"
        className="mt-3"
        selected={noneSelectionActive}
        onSelect={() => onSelect([], false)}
      >
        <p className="m-0">
          <FormattedMessage id="select.sources.select.none" />
        </p>
        {noneSelectionActive ? (
          <div className="mt-2 tv-select-sources-type-none-subtitle">
            <FormattedMessage id="select.sources.select.none.subtitle" />
          </div>
        ) : (
          ''
        )}
      </Radio>
      <Link id="nextStep" to={isValid ? nextPath : '#'}>
        <button type="button" className={`btn btn-primary mt-5 ${!isValid ? 'disabled' : ''}`}>
          <FormattedMessage id="steps.next" />
        </button>
      </Link>
      {validationSelectionErrorElement(validationErrorCode)}
    </div>
  );
};

const noop = () => null;

SelectSources.defaultProps = {
  recommendedFundIsin: '',
  sourceFunds: [],
  targetFunds: [],
  loadingSourceFunds: false,
  loadingTargetFunds: false,
  sourceSelection: [],
  sourceSelectionExact: false,
  onSelect: noop,
  error: null,
};

SelectSources.propTypes = {
  recommendedFundIsin: Types.string,
  sourceSelection: Types.arrayOf(Types.shape({ targetFundIsin: Types.string })),
  sourceSelectionExact: Types.bool,
  sourceFunds: Types.arrayOf(Types.shape({})),
  targetFunds: Types.arrayOf(Types.shape({})),
  loadingSourceFunds: Types.bool,
  loadingTargetFunds: Types.bool,
  onSelect: Types.func,
  error: Types.shape({ body: Types.string }),
  nextPath: Types.string.isRequired,
};

const mapStateToProps = (state) => ({
  recommendedFundIsin: (state.login.user || {}).age < 55 ? 'EE3600109435' : '',
  sourceSelection: state.exchange.sourceSelection,
  sourceSelectionExact: state.exchange.sourceSelectionExact,
  sourceFunds: state.exchange.sourceFunds,
  targetFunds: state.exchange.targetFunds,
  loadingSourceFunds: state.exchange.loadingSourceFunds,
  loadingTargetFunds: state.exchange.loadingTargetFunds,
  error: state.exchange.error,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      onSelect: selectExchangeSources,
    },
    dispatch,
  );

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(SelectSources);
