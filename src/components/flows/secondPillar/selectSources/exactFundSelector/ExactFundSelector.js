/* eslint-disable react/no-array-index-key */
import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { FormattedMessage } from 'react-intl';

import FundExchangeRow from './fundExchangeRow';
import { isTuleva } from '../../../../common/utils';

function createSelectionChangeHandler(index, selections, onChange) {
  return (newSelection) =>
    onChange([
      ...selections.slice(0, index),
      ...(newSelection ? [newSelection] : []),
      ...selections.slice(index + 1),
    ]);
}

function createRowAdder({ sourceFunds, targetFunds, selections, onChange }) {
  const tulevaFunds = targetFunds.filter((fund) => isTuleva(fund));
  return () =>
    onChange(
      selections.concat({
        sourceFundIsin: sourceFunds[0].isin,
        targetFundIsin:
          tulevaFunds[0].isin !== sourceFunds[0].isin ? tulevaFunds[0].isin : tulevaFunds[1].isin,
        percentage: 1,
      }),
    );
}

const ExactFundSelector = ({ selections, sourceFunds, targetFunds, onChange }) => (
  <>
    {selections && selections.length ? (
      <div className="row mt-3">
        {selections.map((selection, index) => (
          <FundExchangeRow
            key={index}
            selection={selection}
            sourceFunds={sourceFunds}
            targetFunds={targetFunds}
            onChange={createSelectionChangeHandler(index, selections, onChange)}
          />
        ))}
      </div>
    ) : (
      ''
    )}
    <button
      type="button"
      className="btn btn-outline-primary px-3 mt-3"
      onClick={createRowAdder({
        sourceFunds,
        targetFunds,
        selections,
        onChange,
      })}
    >
      <FormattedMessage id="select.sources.select.some.add" />
    </button>
  </>
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
