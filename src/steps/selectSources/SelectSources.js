import React, { PropTypes as Types } from 'react';
import { Message } from 'retranslate';
import { Link } from 'react-router';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { selectExchangeSources } from '../../exchange/actions';
import { Loader, Radio } from '../../common';
import PensionFundTable from './pensionFundTable';
import TargetFundSelector from './targetFundSelector';
import ExactFundSelector from './exactFundSelector';

function selectAllWithTarget(sourceFunds, targetFund) {
  return sourceFunds.map(fund => ({
    sourceFundIsin: fund.isin,
    targetFundIsin: targetFund.isin,
    percentage: 1,
  }));
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
}) => {
  if (loadingSourceFunds || loadingTargetFunds) {
    return <Loader className="align-middle" />;
  }
  const defaultTargetFund = targetFunds && targetFunds.length ? targetFunds[0] : null;
  const fullSelectionActive = !!sourceSelection.length && !sourceSelectionExact;
  const noneSelectionActive = !sourceSelection.length && !sourceSelectionExact;
  return (
    <div>
      <div className="px-col mb-4">
        <p className="mb-4 mt-5 lead"><Message>select.sources.current.status</Message></p>
        <PensionFundTable funds={sourceFunds} />
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
      <div className="px-col">
        <Link className="btn btn-primary mt-5" to="/steps/transfer-future-capital">
          <Message>steps.next</Message>
        </Link>
      </div>
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
};

const mapStateToProps = state => ({
  recommendedFundIsin: (state.login.user || {}).age < 55 ? 'AE0000000001' : '',
  sourceSelection: state.exchange.sourceSelection,
  sourceSelectionExact: state.exchange.sourceSelectionExact,
  sourceFunds: state.exchange.sourceFunds,
  targetFunds: state.exchange.targetFunds,
  loadingSourceFunds: state.exchange.loadingSourceFunds,
  loadingTargetFunds: state.exchange.loadingTargetFunds,
});

const mapDispatchToProps = dispatch => bindActionCreators({
  onSelect: selectExchangeSources,
}, dispatch);

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(SelectSources);
