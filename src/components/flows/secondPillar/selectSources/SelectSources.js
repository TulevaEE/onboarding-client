import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { Message } from 'retranslate';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { Link, Redirect } from 'react-router-dom';
import { selectExchangeSources } from '../../../exchange/actions';
import { Loader, Radio, ErrorMessage } from '../../../common';
import PensionFundTable from './pensionFundTable';
import TargetFundSelector from './targetFundSelector';
import ExactFundSelector from './exactFundSelector';
import { isTuleva } from '../../../common/utils';

function selectAllWithTarget(sourceFunds, targetFund) {
  return sourceFunds
    .filter((fund, index, list) => list.length === 1 || fund.isin !== targetFund.isin)
    .map((fund) => ({
      sourceFundIsin: fund.isin,
      targetFundIsin: targetFund.isin,
      percentage: 1,
    }));
}

function selectionsValid(selections) {
  const sourceFundPercentages = {};
  let isValid = true;
  selections.forEach((selection) => {
    if (!sourceFundPercentages[selection.sourceFundIsin]) {
      sourceFundPercentages[selection.sourceFundIsin] = 0;
    }
    sourceFundPercentages[selection.sourceFundIsin] += selection.percentage;
    if (sourceFundPercentages[selection.sourceFundIsin] > 1) {
      isValid = false;
    }

    if (selection.sourceFundIsin === selection.targetFundIsin) {
      isValid = false;
    }
  });

  return isValid;
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
  if (error) {
    return <ErrorMessage errors={error.body} />;
  }
  if (loadingSourceFunds || loadingTargetFunds) {
    return <Loader className="align-middle" />;
  }
  const fullSelectionActive = !!sourceSelection.length && !sourceSelectionExact;
  const noneSelectionActive = !sourceSelection.length && !sourceSelectionExact;
  const isValid = selectionsValid(sourceSelection);
  const tulevaTargetFunds =
    targetFunds && targetFunds.length && targetFunds.filter((fund) => isTuleva(fund));
  const defaultTargetFund =
    tulevaTargetFunds && tulevaTargetFunds.length ? tulevaTargetFunds[0] : null;
  return (
    <div>
      {sourceFunds && !sourceFunds.length && <Redirect to={nextPath} />}
      <div className="row justify-content-around align-items-center">
        <div className="col-12">
          <div className="px-col mb-4">
            <p className="mb-4 lead">
              <Message>select.sources.current.status</Message>
            </p>
            <PensionFundTable funds={sourceFunds} />
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
          <Message>select.sources.select.all</Message>
        </h3>
        {fullSelectionActive ? (
          <div className="mt-3">
            <Message dangerouslyTranslateInnerHTML="select.sources.select.all.subtitle" />

            <div className="mt-4">
              <Message className="pt-2">select.sources.select.all.choose</Message>
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
          <Message>select.sources.select.some</Message>
        </h3>
        {sourceSelectionExact ? (
          <div className="mt-3">
            <Message>select.sources.select.some.subtitle</Message>
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
          <Message>select.sources.select.none</Message>
        </p>
        {noneSelectionActive ? (
          <div className="mt-2 tv-select-sources-type-none-subtitle">
            <Message>select.sources.select.none.subtitle</Message>
          </div>
        ) : (
          ''
        )}
      </Radio>

      <Link id="nextStep" to={isValid ? nextPath : '#'}>
        <button type="button" className={`btn btn-primary mt-5 ${!isValid ? 'disabled' : ''}`}>
          <Message>steps.next</Message>
        </button>
      </Link>
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
