import React from 'react';
import { PropTypes as Types } from 'prop-types';

import { createClamper } from '../../../../../common/utils';
import './FundExchangeRow.scss';

const clampFromZeroToHundred = createClamper(0, 100);

export const FundExchangeRow = ({ sourceFunds, targetFunds, onChange, selection }) => {
  const randomString = (Math.random() + 1).toString(36).substring(7);
  const randomId = `tv-percentage-selector-${randomString}`;
  const sortedSourceFunds = sourceFunds
    .slice()
    .sort((fund1, fund2) => fund1.name.localeCompare(fund2.name));
  const sortedTargetFunds = targetFunds
    .slice()
    .sort((fund1, fund2) => fund1.name.localeCompare(fund2.name));
  return (
    <div className="row">
      <div className="col-12 col-md mt-2">
        <div className="input-group">
          <select
            className="custom-select"
            value={selection.sourceFundIsin}
            onChange={({ target: { value: sourceFundIsin } }) =>
              onChange({ ...selection, sourceFundIsin })
            }
          >
            {sortedSourceFunds.map((fund) => (
              <option key={fund.isin} value={fund.isin}>
                {fund.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="col-12 col-md mt-2">
        <div className="input-group">
          <select
            className="custom-select"
            value={selection.targetFundIsin}
            onChange={({ target: { value: targetFundIsin } }) =>
              onChange({ ...selection, targetFundIsin })
            }
          >
            {sortedTargetFunds.map((fund) => (
              <option key={fund.isin} value={fund.isin}>
                {fund.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="col-12 col-md-2 mt-2">
        <div className="input-group tv-percentage-selector">
          <input
            id={randomId}
            className="form-control pr-0"
            min="0"
            max="100"
            value={(selection.percentage * 100).toFixed()}
            type="number"
            onChange={({ target: { value } }) =>
              onChange({
                ...selection,
                percentage: clampFromZeroToHundred(parseInt(value, 10)) / 100,
              })
            }
          />
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label htmlFor={randomId} className="tv-percentage-selector__addon">
            %
          </label>
        </div>
      </div>
      <div className="col-12 col-md-1 mt-2 d-flex flex-column justify-content-center">
        <button type="button" className="removeButton" onClick={() => onChange(null)}>
          <span className="fa fa-times" />
        </button>
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
  sourceFunds: Types.arrayOf(
    Types.shape({
      isin: Types.string.isRequired,
      name: Types.string.isRequired,
    }),
  ),
  targetFunds: Types.arrayOf(
    Types.shape({
      isin: Types.string.isRequired,
      name: Types.string.isRequired,
    }),
  ),
  onChange: Types.func,
};

export default FundExchangeRow;
