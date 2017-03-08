import React, { PropTypes as Types } from 'react';

import './FundExchangeRow.scss';

const FundExchangeRow = ({ sourceFunds, targetFunds, onChange, selection }) => {
  const randomString = (Math.random() + 1).toString(36).substring(7);
  const randomId = `tv-percentage-selector-${randomString}`;
  return (
    <div className="row mt-2">
      <div className="col-12 col-sm-5">
        <div className="input-group">
          <select
            className="custom-select"
            value={selection.sourceFundIsin}
            onChange={
              ({ target: { value: sourceFundIsin } }) => onChange({ ...selection, sourceFundIsin })
            }
          >
            {
              sourceFunds.map(fund =>
                <option key={fund.isin} value={fund.isin}>
                  {fund.name}
                </option>,
              )
            }
          </select>
        </div>
      </div>
      <div className="col-12 col-sm">
        <div className="input-group tv-percentage-selector">
          <input
            id={randomId}
            className="form-control pr-0"
            min="0"
            max="100"
            value={selection.percentage * 100}
            type="number"
            onChange={
              ({ target: { value } }) => onChange({
                ...selection, percentage: parseInt(value, 10) / 100,
              })
            }
          />
          <label htmlFor={randomId} className="tv-percentage-selector__addon">%</label>
        </div>
      </div>
      <div className="col-12 col-sm-5">
        <div className="input-group">
          <select
            className="custom-select"
            value={selection.targetFundIsin}
            onChange={
              ({ target: { value: targetFundIsin } }) => onChange({ ...selection, targetFundIsin })}
          >
            {
              targetFunds.map(fund =>
                <option key={fund.isin} value={fund.isin}>
                  {fund.name}
                </option>,
              )
            }
          </select>
        </div>
      </div>
    </div>
  );
};

const noop = () => null;

FundExchangeRow.defaultProps = {
  selection: { sourceFundIsin: '', targetFundIsin: '', percentage: 0 },
  sourceFunds: [],
  targetFunds: [],
  onChange: noop,
};

FundExchangeRow.propTypes = {
  selection: Types.shape({
    sourceFundIsin: Types.string.isRequired,
    targetFundIsin: Types.string.isRequired,
    percentage: Types.number.isRequired,
  }),
  sourceFunds: Types.arrayOf(Types.shape({
    isin: Types.string.isRequired,
    name: Types.string.isRequired,
  })),
  targetFunds: Types.arrayOf(Types.shape({
    isin: Types.string.isRequired,
    name: Types.string.isRequired,
  })),
  onChange: Types.func,
};

export default FundExchangeRow;
