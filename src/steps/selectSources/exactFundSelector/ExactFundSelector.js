import React, { PropTypes as Types } from 'react';
import { Message } from 'retranslate';

import './ExactFundSelector.scss';

function createOnSelectHandlerForFundAndSelections(fund, selections, onSelect) {
  return (event) => {
    onSelect(selections.map((currentFund) => {
      if (currentFund.isin === fund.isin) {
        return {
          ...currentFund,
          percentage: parseInt(event.target.value, 10) / 100,
        };
      }
      return currentFund;
    }));
  };
}

const ExactFundSelector = ({ selections, onSelect }) => (
  <div>
    <div className="row mt-4">
      <div className="col">
        <b><Message>select.sources.select.some.current</Message></b>
      </div>
      <div className="col">
        <b><Message>select.sources.select.some.select</Message></b>
      </div>
    </div>
    {
      selections.map(fund => (
        <div className="row mt-2" key={fund.isin}>
          <div className="col">
            <Message>{fund.name}</Message>
          </div>
          <div className="col">
            <div className="input-group input-group-sm tv-exact-fund-selector">
              <input
                className="form-control"
                min="0"
                max="100"
                value={fund.percentage * 100}
                type="number"
                onChange={createOnSelectHandlerForFundAndSelections(fund, selections, onSelect)}
              />
              <span className="input-group-addon">%</span>
            </div>
          </div>
        </div>
      ))
    }
    <div className="mt-4">
      <small><Message>select.sources.select.some.cost</Message></small>
    </div>
  </div>
);

const noop = () => null;

ExactFundSelector.defaultProps = {
  selections: [],
  onSelect: noop,
};

ExactFundSelector.propTypes = {
  selections: Types.arrayOf(Types.shape({
    name: Types.string.isRequired,
    percentage: Types.number.isRequired,
  })),
  onSelect: Types.func,
};

export default ExactFundSelector;
