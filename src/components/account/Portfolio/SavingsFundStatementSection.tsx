import React, { useCallback, useState } from 'react';
import moment from 'moment';
import { usePortfolio } from './api/portfolio.api';
import { PeriodSelector } from './PeriodSelector';
import { StatementSection } from './StatementSection';

export const SavingsFundStatementSection: React.FunctionComponent = () => {
  // Opens on the whole history: an undefined start lets the backend begin at the first
  // price it has rather than a date the client would have to guess.
  const [period, setPeriod] = useState<{ from: string | undefined; to: string }>({
    from: undefined,
    to: moment().format('YYYY-MM-DD'),
  });

  const { data: portfolio } = usePortfolio(period.from, period.to);
  const savingsFundSummary = portfolio?.groups.find((group) => group.group === 'SAVINGS_FUND');

  const onPeriodChange = useCallback((from: string | undefined, to: string) => {
    setPeriod({ from, to });
  }, []);

  return (
    <>
      <div className="card p-4 mt-5">
        <PeriodSelector from={period.from} to={period.to} onPeriodChange={onPeriodChange} />
      </div>
      {portfolio && savingsFundSummary && (
        <StatementSection summary={savingsFundSummary} from={portfolio.from} to={portfolio.to} />
      )}
    </>
  );
};
