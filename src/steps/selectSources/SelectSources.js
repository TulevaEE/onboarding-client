import React, { PropTypes as Types } from 'react';
import { Message } from 'retranslate';
import { Link } from 'react-router';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { selectExchangeSources } from '../../exchange/actions';
import { Loader, Radio } from '../../common';
import PensionFundTable from './pensionFundTable';
import ExactFundSelector from './exactFundSelector';

function isFullSelection(sourceSelection) {
  return sourceSelection.reduce((isFull, { percentage }) => isFull && percentage === 1, true);
}

function isNoneSelection(sourceSelection) {
  return sourceSelection.reduce((isNone, { percentage }) => isNone && percentage === 0, true);
}

function selectFull(sourceSelection) {
  return sourceSelection.map(fund => ({ ...fund, percentage: 1 }));
}

function selectNone(sourceSelection) {
  return sourceSelection.map(fund => ({ ...fund, percentage: 0 }));
}

export const SelectSources = ({
  loadingSourceFunds,
  sourceFunds,
  sourceSelection,
  onSelect,
  sourceSelectionExact,
}) => {
  if (loadingSourceFunds) {
    return <Loader className="align-middle" />;
  }
  const fullSelectionActive = isFullSelection(sourceSelection) && !sourceSelectionExact;
  const noneSelectionActive = isNoneSelection(sourceSelection) && !sourceSelectionExact;
  return (
    <div>
      <div className="px-col mb-4">
        <p className="mb-4 mt-5 lead"><Message>select.sources.current.status</Message></p>
        <PensionFundTable funds={sourceFunds} />
      </div>
      <Radio
        name="tv-select-sources-type"
        selected={fullSelectionActive}
        onSelect={() => onSelect(selectFull(sourceSelection), false)}
      >
        <h3 className="m-0"><Message>select.sources.select.all</Message></h3>
        {
          fullSelectionActive ? (
            <div className="mt-2">
              <Message>select.sources.select.all.subtitle</Message>
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
        <h3><Message>select.sources.select.some</Message></h3>
        <Message>select.sources.select.some.subtitle</Message>
        {
          sourceSelectionExact ?
            <ExactFundSelector
              selections={sourceSelection}
              onSelect={selection => onSelect(selection, true)}
            /> : ''
        }
      </Radio>
      <Radio
        name="tv-select-sources-type"
        className="mt-3"
        selected={isNoneSelection(sourceSelection) && !sourceSelectionExact}
        onSelect={() => onSelect(selectNone(sourceSelection), false)}
      >
        <h3 className="m-0"><Message>select.sources.select.none</Message></h3>
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
  sourceFunds: [],
  loadingSourceFunds: false,
  sourceSelection: [],
  sourceSelectionExact: false,
  onSelect: noop,
};

SelectSources.propTypes = {
  sourceSelection: Types.arrayOf(Types.shape({})),
  sourceSelectionExact: Types.bool,
  sourceFunds: Types.arrayOf(Types.shape({})),
  loadingSourceFunds: Types.bool,
  onSelect: Types.func,
};

const mapStateToProps = state => ({
  sourceSelection: state.exchange.sourceSelection,
  sourceSelectionExact: state.exchange.sourceSelectionExact,
  sourceFunds: state.exchange.sourceFunds,
  loadingSourceFunds: state.exchange.loadingSourceFunds,
});

const mapDispatchToProps = dispatch => bindActionCreators({
  onSelect: selectExchangeSources,
}, dispatch);

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(SelectSources);
