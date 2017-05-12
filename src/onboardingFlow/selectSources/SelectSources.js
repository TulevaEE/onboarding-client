import React, { PropTypes as Types } from 'react';
import { Message } from 'retranslate';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { routeForwardFromSourceSelection } from '../../router/actions';
import { selectExchangeSources } from '../../exchange/actions';
import { Loader, Radio, ErrorAlert } from '../../common';
import PensionFundTable from './pensionFundTable';
import TargetFundSelector from './targetFundSelector';
import ExactFundSelector from './exactFundSelector';
import ComparisonWidget from '../../common/comparison/widget';

function selectAllWithTarget(sourceFunds, targetFund) {
  return sourceFunds
    .filter((fund, index, list) => list.length === 1 || fund.isin !== targetFund.isin)
    .map(fund => ({
      sourceFundIsin: fund.isin,
      targetFundIsin: targetFund.isin,
      percentage: 1,
    }));
}

function selectionsValid(selections) {
  const sourceFundPercentages = {};
  let valid = true;
  selections.forEach((selection) => {
    if (!sourceFundPercentages[selection.sourceFundIsin]) {
      sourceFundPercentages[selection.sourceFundIsin] = 0;
    }
    sourceFundPercentages[selection.sourceFundIsin] += selection.percentage;
    if (sourceFundPercentages[selection.sourceFundIsin] > 1) {
      valid = false;
    }

    if (selection.sourceFundIsin === selection.targetFundIsin) {
      valid = false;
    }
  });

  return valid;
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
  errorDescription,
  onNextStep,
}) => {
  if (errorDescription) {
    return <ErrorAlert description={errorDescription} />;
  }
  if (loadingSourceFunds || loadingTargetFunds) {
    return <Loader className="align-middle" />;
  }
  const defaultTargetFund = targetFunds && targetFunds.length ? targetFunds[0] : null;
  const fullSelectionActive = !!sourceSelection.length && !sourceSelectionExact;
  const noneSelectionActive = !sourceSelection.length && !sourceSelectionExact;
  const valid = selectionsValid(sourceSelection);
  return (
    <div>
      <div className="row justify-content-around align-items-center">
        <div className="col-8">
          <div className="px-col mb-4">
            <p className="mb-4 lead"><Message>select.sources.current.status</Message></p>
            <PensionFundTable funds={sourceFunds} />
          </div>
        </div>
        <div className="col-4 mb-4">
          <ComparisonWidget />
        </div>
      </div>
      <Radio
        name="tv-select-sources-type"
        selected={fullSelectionActive}
        onSelect={() => onSelect(selectAllWithTarget(sourceFunds, defaultTargetFund), false)}
      >
        <h3 className="m-0"><Message>select.sources.select.all</Message></h3>
        {
          fullSelectionActive ? (
            <div className="mt-3">

              <Message>select.sources.select.all.subtitle</Message>
              <div className="mt-4">
                <Message className="pt-2">select.sources.select.all.choose</Message>
              </div>
              <TargetFundSelector
                targetFunds={targetFunds}
                onSelectFund={
                  targetFund => onSelect(selectAllWithTarget(sourceFunds, targetFund), false)}
                selectedTargetFundIsin={sourceSelection[0].targetFundIsin}
                recommendedFundIsin={recommendedFundIsin}
              />
            </div>
          ) : ''
        }
      </Radio>
      <Radio
        name="tv-select-sources-type"
        className="mt-3"
        selected={sourceSelectionExact}
        onSelect={() => onSelect(sourceSelection, true)}
      >
        <h3 className="m-0"><Message>select.sources.select.some</Message></h3>
        {
          sourceSelectionExact ?
            <div className="mt-3">
              <Message>select.sources.select.some.subtitle</Message>
              <ExactFundSelector
                selections={sourceSelection}
                sourceFunds={sourceFunds}
                targetFunds={targetFunds}
                onChange={selection => onSelect(selection, true)}
              />
            </div> : ''
        }
      </Radio>
      <Radio
        name="tv-select-sources-type"
        className="mt-3"
        selected={noneSelectionActive}
        onSelect={() => onSelect([], false)}
      >
        <p className="m-0"><Message>select.sources.select.none</Message></p>
        {
          noneSelectionActive ? (
            <div className="mt-2 tv-select-sources-type-none-subtitle">
              <Message>select.sources.select.none.subtitle</Message>
            </div>
          ) : ''
        }
      </Radio>

      <button
        id="nextStep"
        className={`btn btn-primary mt-5 ${!valid ? 'disabled' : ''}`}
        onClick={onNextStep}
      >
        <Message>steps.next</Message>
      </button>
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
  errorDescription: '',
  onNextStep: noop,
};

SelectSources.propTypes = {
  recommendedFundIsin: Types.string,
  sourceSelection: Types.arrayOf(Types.shape({})),
  sourceSelectionExact: Types.bool,
  sourceFunds: Types.arrayOf(Types.shape({})),
  targetFunds: Types.arrayOf(Types.shape({})),
  loadingSourceFunds: Types.bool,
  loadingTargetFunds: Types.bool,
  onSelect: Types.func,
  errorDescription: Types.string,
  onNextStep: Types.func,
};

const mapStateToProps = state => ({
  recommendedFundIsin: (state.login.user || {}).age < 55 ? 'EE3600109435' : '',
  sourceSelection: state.exchange.sourceSelection,
  sourceSelectionExact: state.exchange.sourceSelectionExact,
  sourceFunds: state.exchange.sourceFunds,
  targetFunds: state.exchange.targetFunds,
  loadingSourceFunds: state.exchange.loadingSourceFunds,
  loadingTargetFunds: state.exchange.loadingTargetFunds,
  errorDescription: state.exchange.error,
});

const mapDispatchToProps = dispatch => bindActionCreators({
  onSelect: selectExchangeSources,
  onNextStep: routeForwardFromSourceSelection,
}, dispatch);

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(SelectSources);
