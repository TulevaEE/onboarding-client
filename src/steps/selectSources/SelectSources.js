import React, { PropTypes as Types } from 'react';
import { Message } from 'retranslate';
import { Link } from 'react-router';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { selectExchangeSources } from '../../exchange/actions';
import { Loader, Radio } from '../../common';
import PensionFundTable from './pensionFundTable';

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
  return (
    <div>
      <div className="px-col mb-4">
        <p className="mb-4 mt-4"><Message>select.sources.current.status</Message></p>
        <PensionFundTable funds={sourceFunds} />
      </div>
      <Radio
        name="tv-select-sources-type"
        selected={isFullSelection(sourceSelection) && !sourceSelectionExact}
        onSelect={() => onSelect(selectFull(sourceSelection), false)}
      >
        <h3><Message>select.sources.select.all</Message></h3>
        <Message>select.sources.select.all.subtitle</Message>
      </Radio>
      {/* TODO: write tests once we add this section
      <Radio
        name="tv-select-sources-type"
        className="mt-3"
        selected={sourceSelectionExact}
        onSelect={() => onSelect(sourceSelection, true)}
      >
        <h3><Message>select.sources.select.some</Message></h3>
        <Message>select.sources.select.some.subtitle</Message>
      </Radio>*/}
      <Radio
        name="tv-select-sources-type"
        className="mt-3"
        selected={isNoneSelection(sourceSelection) && !sourceSelectionExact}
        onSelect={() => onSelect(selectNone(sourceSelection), false)}
      >
        <h3><Message>select.sources.select.none</Message></h3>
        <Message>select.sources.select.none.subtitle</Message>
      </Radio>
      <div className="px-col">
        <Link className="btn btn-primary mt-4 mb-4" to="/steps/select-fund">
          <Message>steps.next</Message>
        </Link>
        <br />
        <small className="text-muted">
          <Message>select.sources.calculation.info</Message>
        </small>
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
