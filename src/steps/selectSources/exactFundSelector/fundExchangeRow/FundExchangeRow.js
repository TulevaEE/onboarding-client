import React, { PropTypes as Types } from 'react';

const FundExchangeRow = ({ sourceFunds, targetFunds, onChange, selection }) => (
  <div className="row mt-2">
    <div className="col-5">
      <div className="input-group input-group-sm">
        <select
          className="form-control"
          value={selection.sourceFundIsin}
          onChange={
            ({ target: { value: sourceFundIsin } }) => onChange({ ...selection, sourceFundIsin })
          }
        >
          {
            sourceFunds.map(fund => <option key={fund.isin} value={fund.isin}>{fund.name}</option>)
          }
        </select>
      </div>
    </div>
    <div className="col">
      <div className="input-group input-group-sm tv-exact-fund-selector">
        <input
          className="form-control"
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
      </div>
    </div>
    <div className="col-5">
      <div className="input-group input-group-sm">
        <select
          className="form-control"
          value={selection.targetFundIsin}
          onChange={
            ({ target: { value: targetFundIsin } }) => onChange({ ...selection, targetFundIsin })}
        >
          {
            targetFunds.map(fund => <option key={fund.isin} value={fund.isin}>{fund.name}</option>)
          }
        </select>
      </div>
    </div>
  </div>
);

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
