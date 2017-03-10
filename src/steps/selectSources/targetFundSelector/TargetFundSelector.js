import React, { PropTypes as Types } from 'react';
import { Message } from 'retranslate';

import { InfoTooltip } from '../../../common';
import TargetFundTooltipBody from '../../transferFutureCapital/targetFundTooltipBody';

import './TargetFundSelector.scss';
import checkImage from '../../success/success.svg';

const TargetFundSelector = ({ targetFunds, onSelectFund, selectedTargetFundIsin }) => (
  <div className="row mx-0 mt-2 tv-target-fund__container">
    {
      targetFunds.map(fund => (
        <button
          key={fund.isin}
          className={`
            col-12 col-sm tv-target-fund p-4 mr-2 text-left mb-2
            ${selectedTargetFundIsin === fund.isin ? 'tv-target-fund--active' : ''}
          `}
          onClick={() => onSelectFund(fund)}
        >
          {(selectedTargetFundIsin === fund.isin) ?
            (<div className="tv-target-fund__corner-check">
              <span>
                <img src={checkImage} alt="Success" />
              </span>
            </div>)
            : ''}
          <div className="tv-target-fund__inner-container">
            <div className="mb-2">
              <b><Message>{`target.funds.${fund.isin}.title`}</Message></b>
              <InfoTooltip name={fund.isin}>
                <TargetFundTooltipBody targetFundIsin={fund.isin} />
              </InfoTooltip>
            </div>
            <small>
              <div className="mb-2">
                <Message>{`target.funds.${fund.isin}.description`}</Message>
              </div>
              <a href="https://tuleva.ee/fondid/" target="_blank" rel="noopener noreferrer">
                <Message>target.funds.terms</Message>
              </a>
            </small>
          </div>
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
