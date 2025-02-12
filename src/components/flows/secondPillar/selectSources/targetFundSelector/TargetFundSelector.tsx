import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import './TargetFundSelector.scss';
import checkImage from '../../../common/SuccessNotice/success.svg';
import { Fund } from '../../../../common/apiModels';
import { Fees } from '../../../../common/Percentage/Fees';
import { TulevaFundIsin } from '../../../../common/utils';

type Props = {
  targetFunds: Fund[];
  onSelectFund: (fund: Fund) => void;
  isSelected: (fund: Fund) => boolean;
};

export const TargetFundSelector: React.FunctionComponent<Props> = ({
  targetFunds = [],
  onSelectFund,
  isSelected = () => false,
}) => {
  const { formatMessage } = useIntl();

  return (
    <div className="row mx-0 mt-3 tv-target-fund__container align-items-stretch">
      {targetFunds.map((fund) => (
        <div key={fund.isin} className="col-12 col-sm mb-2 me-2 p-0">
          <button
            type="button"
            className={`
                tv-target-fund h-100 p-4 text-start
                ${isSelected(fund) ? 'tv-target-fund--active' : ''}
              `}
            onClick={() => onSelectFund(fund)}
          >
            {isSelected(fund) ? (
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
                <b>{fund.name}</b>
              </div>
              <small>
                <div className="mb-2">
                  <FormattedMessage id="target.funds.fees" />:{' '}
                  <Fees className="fw-bold" value={fund.ongoingChargesFigure} />
                </div>
                <div className="mb-2">
                  <FormattedMessage
                    id={`target.funds.${fund.isin as TulevaFundIsin}.description`}
                  />
                </div>
                <a
                  className="tv-target-fund__terms-link"
                  href={formatMessage({
                    id: `target.funds.${fund.isin as TulevaFundIsin}.terms.link`,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FormattedMessage id="target.funds.terms" />
                </a>
              </small>
            </div>
          </button>
        </div>
      ))}
    </div>
  );
};

export default TargetFundSelector;
