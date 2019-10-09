import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { Message } from 'retranslate';

// import advancedFundDiagram from './advanced.png';
// import conservativeFundDiagram from './conservative.png';

// FIXME : make these independed from code
// const ADVANCED_TARGET_FUND_ISIN = 'EE3600109435';
// const CONSERVATIVE_TARGET_FUND_ISIN = 'EE3600109443';

function getTooltipBodyData(fundIsin) {
  // if (ADVANCED_TARGET_FUND_ISIN === fundIsin) {
  //   return {
  //     funds: [
  //       `target.funds.${ADVANCED_TARGET_FUND_ISIN}.tooltip.investment.1`,
  //       `target.funds.${ADVANCED_TARGET_FUND_ISIN}.tooltip.investment.2`,
  //       `target.funds.${ADVANCED_TARGET_FUND_ISIN}.tooltip.investment.3`,
  //       `target.funds.${ADVANCED_TARGET_FUND_ISIN}.tooltip.investment.4`,
  //       `target.funds.${ADVANCED_TARGET_FUND_ISIN}.tooltip.investment.5`,
  //     ],
  //     diagram: advancedFundDiagram,
  //   };
  // }
  // if (CONSERVATIVE_TARGET_FUND_ISIN === fundIsin) {
  //   return {
  //     funds: [
  //       `target.funds.${CONSERVATIVE_TARGET_FUND_ISIN}.tooltip.investment.1`,
  //       `target.funds.${CONSERVATIVE_TARGET_FUND_ISIN}.tooltip.investment.2`,
  //       `target.funds.${CONSERVATIVE_TARGET_FUND_ISIN}.tooltip.investment.3`,
  //       `target.funds.${CONSERVATIVE_TARGET_FUND_ISIN}.tooltip.investment.4`,
  //     ],
  //     diagram: conservativeFundDiagram,
  //   };
  // }
  return [];
}

const TargetFundTooltipBody = ({ targetFundIsin }) => {
  if (getTooltipBodyData(targetFundIsin).length === 0) {
    return <div className="target-fund-tooltip__no-data">No data available for this fund</div>;
  }
  return (
    <div className="target-fund-tooltip">
      <h3 className="mt-3 mb-3">
        <b>
          <Message>{`target.funds.${targetFundIsin}.tooltip.title`}</Message>
        </b>
      </h3>
      <img
        src={getTooltipBodyData(targetFundIsin).diagram}
        alt="Fund diagram"
        width="180px"
        height="180px"
        className="diagram"
      />
      <ul className="mt-4">
        {getTooltipBodyData(targetFundIsin).funds.map(item => (
          <li key={item}>
            <Message>{item}</Message>
          </li>
        ))}
      </ul>
    </div>
  );
};

TargetFundTooltipBody.propTypes = {
  targetFundIsin: Types.string.isRequired,
};

export default TargetFundTooltipBody;
