import React, { useCallback, useState } from 'react';
import moment from 'moment';
import { FormattedMessage } from 'react-intl';
import { useSavingsFundBalance } from '../../common/apiHooks';
import { currentValueByGroup } from '../../common/balances';
import { usePortfolio } from './api/portfolio.api';
import { withCurrentValue } from './currentValue';
import { PeriodSelector } from './PeriodSelector';
import { StatementSection } from './StatementSection';

export const SavingsFundStatementSection: React.FunctionComponent = () => {
  const [period, setPeriod] = useState<{ from: string | undefined; to: string }>({
    from: undefined,
    to: moment().format('YYYY-MM-DD'),
  });

  const { data: portfolio, isError, refetch } = usePortfolio(period.from, period.to);
  const savingsBalance = useSavingsFundBalance();

  const onPeriodChange = useCallback((from: string | undefined, to: string) => {
    setPeriod({ from, to });
  }, []);

  const savingsFundSummary = portfolio?.groups.find((group) => group.group === 'SAVINGS_FUND');

  const runsToToday = portfolio?.to === moment().format('YYYY-MM-DD');
  const registerAnswered = runsToToday && savingsBalance.isSuccess;
  const registerBalance = registerAnswered
    ? currentValueByGroup(undefined, savingsBalance.data).SAVINGS_FUND
    : undefined;

  return (
    <>
      <div className="card p-4 mt-5">
        <PeriodSelector
          from={period.from}
          to={period.to}
          allTimeStartDate={portfolio?.from}
          onPeriodChange={onPeriodChange}
        />
      </div>

      {isError && (
        <div
          role="alert"
          className="alert alert-danger d-flex flex-wrap gap-3 align-items-center justify-content-between"
        >
          <span>
            <FormattedMessage id="myMoney.pricesUnavailable" />
          </span>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => refetch()}>
            <FormattedMessage id="myMoney.retry" />
          </button>
        </div>
      )}

      {!isError && portfolio && savingsFundSummary && (
        <StatementSection
          summary={withCurrentValue(savingsFundSummary, registerBalance)}
          from={portfolio.from}
          to={portfolio.to}
        />
      )}
    </>
  );
};
