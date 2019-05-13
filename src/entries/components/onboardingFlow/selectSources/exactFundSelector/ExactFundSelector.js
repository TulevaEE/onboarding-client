/* eslint-disable react/no-array-index-key */
import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { Message } from 'retranslate';

import FundExchangeRow from './fundExchangeRow';

function createSelectionChangeHandler(index, selections, onChange) {
  return newSelection =>
    onChange([...selections.slice(0, index), newSelection, ...selections.slice(index + 1)]);
}

function createRowAdder({ sourceFunds, targetFunds, selections, onChange }) {
  return () =>
    onChange(
      selections.concat({
        sourceFundIsin: sourceFunds[0].isin,
        targetFundIsin: targetFunds.filter(fund => (fund.fundManager || {}).name === 'Tuleva')[0]
          .isin,
        percentage: 1,
      }),
    );
}

const ExactFundSelector = ({ selections, sourceFunds, targetFunds, onChange }) => (
  <div>
    <div className="row mt-4">
      <div className="col-12 col-sm-5">
        <small>
          <b>
            <Message>select.sources.select.some.source</Message>
          </b>
        </small>
      </div>
      <div className="col-12 col-sm">
        <small>
          <b>
            <Message>select.sources.select.some.percentage</Message>
          </b>
        </small>
      </div>
      <div className="col-12 col-sm-5">
        <small>
          <b>
            <Message>select.sources.select.some.target</Message>
          </b>
        </small>
      </div>
    </div>
    {selections.map((selection, index) => (
      <FundExchangeRow
        key={index}
        selection={selection}
        sourceFunds={sourceFunds}
        targetFunds={targetFunds}
        onChange={createSelectionChangeHandler(index, selections, onChange)}
      />
    ))}
    <div className="row mt-2">
      <div className="col">
        <small>
          <a
            href="//www.pensionikeskus.ee/ii-sammas/fondid/fonditasude-vordlused/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Message>select.sources.select.some.cost</Message>
          </a>
        </small>
      </div>
      <div className="col">
        <button
          type="button"
          className="btn btn-secondary btn-sm float-right"
          onClick={createRowAdder({
            sourceFunds,
            targetFunds,
            selections,
            onChange,
          })}
        >
          <Message>select.sources.select.some.add</Message>
        </button>
      </div>
    </div>
  </div>
);

const noop = () => null;

ExactFundSelector.defaultProps = {
  selections: [],
  sourceFunds: [],
  targetFunds: [],
  onChange: noop,
};

ExactFundSelector.propTypes = {
  selections: Types.arrayOf(Types.shape({})),
  sourceFunds: Types.arrayOf(Types.shape({})),
  targetFunds: Types.arrayOf(Types.shape({})),
  onChange: Types.func,
};

export default ExactFundSelector;
