import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { Message } from 'retranslate';

import { InfoTooltip } from '../../../common';
import TargetFundTooltipBody from '../../transferFutureCapital/targetFundTooltipBody';

import './TargetFundSelector.css';
import checkImage from '../../success/success.svg';

const TargetFundSelector = ({
  targetFunds,
  onSelectFund,
  selectedTargetFundIsin,
  recommendedFundIsin,
}) => (
  <div className="row mx-0 mt-2 tv-target-fund__container">
    {targetFunds.map(fund => (
      <div key={fund.isin} className="col-12 col-sm mb-3 mr-2 p-0">
        <button
          className={`
              tv-target-fund p-4 text-left mb-2
              ${selectedTargetFundIsin === fund.isin ? 'tv-target-fund--active' : ''}
            `}
          onClick={() => onSelectFund(fund)}
        >
          {selectedTargetFundIsin === fund.isin ? (
            <div className="tv-target-fund__corner-check">
              <span>
                <img src={checkImage} alt="Success" />
              </span>
            </div>
          ) : (
            ''
          )}
          <div className="tv-target-fund__inner-container">
            <div className="mb-2">
              <b>
                <Message>{`target.funds.${fund.isin}.title`}</Message>
              </b>
              <InfoTooltip name={fund.isin}>
                <TargetFundTooltipBody targetFundIsin={fund.isin} />
              </InfoTooltip>
            </div>
            <small>
              <div className="mb-2">
                <Message>{`target.funds.${fund.isin}.description`}</Message>
              </div>
              <a
                className="tv-target-fund__terms-link"
                href="https://tuleva.ee/fondid/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Message>target.funds.terms</Message>
              </a>
            </small>
          </div>
        </button>
        {recommendedFundIsin === fund.isin ? (
          <Message>select.sources.select.all.recommended</Message>
        ) : (
          ''
        )}
      </div>
    ))}
  </div>
);

const noop = () => null;

TargetFundSelector.defaultProps = {
  targetFunds: [],
  onSelectFund: noop,
  selectedTargetFundIsin: '',
  recommendedFundIsin: '',
};

TargetFundSelector.propTypes = {
  targetFunds: Types.arrayOf(Types.shape({ isin: Types.string.isRequired })),
  onSelectFund: Types.func,
  selectedTargetFundIsin: Types.string,
  recommendedFundIsin: Types.string,
};

export default TargetFundSelector;
