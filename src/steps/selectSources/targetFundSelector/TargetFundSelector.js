import React, { PropTypes as Types } from 'react';
import { Message } from 'retranslate';

import './TargetFundSelector.scss';

const TargetFundSelector = ({ targetFunds, onSelectFund, selectedTargetFundIsin }) => (
  <div className="row">
    {
      targetFunds.map(fund => (
        <button
          key={fund.isin}
          className={`
            col tv-target-fund
            ${selectedTargetFundIsin === fund.isin ? 'tv-target-fund__active' : ''}
          `}
          onClick={() => onSelectFund(fund)}
        >
          <h4><Message>{`target.funds.${fund.isin}.title`}</Message></h4>
          <Message>{`target.funds.${fund.isin}.description`}</Message>
          <a href={`example.com/${fund.isin}`}> {/* TODO: once we have links, resolve by isin */}
            <Message>target.funds.terms</Message>
          </a>
        </button>
      ))
    }
  </div>
);

const noop = () => null;

TargetFundSelector.defaultProps = {
  targetFunds: [],
  onSelectFund: noop,
  selectedTargetFundIsin: '',
};

TargetFundSelector.propTypes = {
  targetFunds: Types.arrayOf(Types.shape({ isin: Types.string.isRequired })),
  onSelectFund: Types.func,
  selectedTargetFundIsin: Types.string,
};

export default TargetFundSelector;
