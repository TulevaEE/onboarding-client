import React from 'react';
import { PropTypes as Types } from 'prop-types';

import { FormattedMessage } from 'react-intl';
import { createClamper } from '../../../../../common/utils';

const clampFromZeroToHundred = createClamper(0, 100);

export const FundExchangeRow = ({ sourceFunds, targetFunds, onChange, selection }) => {
  const randomString = (Math.random() + 1).toString(36).substring(7);
  const sortedSourceFunds = sourceFunds
    .slice()
    .sort((fund1, fund2) => fund1.name.localeCompare(fund2.name));
  const sortedTargetFunds = targetFunds
    .slice()
    .sort((fund1, fund2) => fund1.name.localeCompare(fund2.name));
  return (
    <div className="card mx-0 mb-2">
      <div className="card-body">
        <div className="row flex-column flex-xl-row">
          <div className="col-12 col-xl-5 pe-xl-2 mb-3">
            <label className="small fw-bold" htmlFor={`tv-source-fund-selector-${randomString}`}>
              <FormattedMessage id="select.sources.select.some.source" />
            </label>
            <select
              id={`tv-source-fund-selector-${randomString}`}
              className="form-select"
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

          <div className="col-12 col-xl-5 px-xl-2 mb-3">
            <label className="small fw-bold" htmlFor={`tv-target-fund-selector-${randomString}`}>
              <FormattedMessage id="select.sources.select.some.target" />
            </label>
            <select
              id={`tv-target-fund-selector-${randomString}`}
              className="form-select"
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

          <div className="col-12 col-xl-2 ps-xl-2 mb-3">
            <label className="small fw-bold" htmlFor={`tv-percentage-selector-${randomString}`}>
              <FormattedMessage id="select.sources.select.some.percentage" />
            </label>
            <div className="input-group">
              <input
                id={`tv-percentage-selector-${randomString}`}
                className="form-control pe-0 d-block"
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
              <span className="input-group-text">%</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-outline-danger px-3"
          onClick={() => onChange(null)}
        >
          <FormattedMessage id="select.sources.select.some.delete" />
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
