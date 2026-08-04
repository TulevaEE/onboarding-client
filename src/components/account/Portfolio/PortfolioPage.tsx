import React, { useCallback, useState } from 'react';
import moment from 'moment';
import { FormattedMessage } from 'react-intl';
import { Shimmer } from '../../common/shimmer/Shimmer';
import { usePageTitle } from '../../common/usePageTitle';
import { usePortfolio } from './api/portfolio.api';
import { PortfolioView } from './PortfolioView';

export const PortfolioPage: React.FunctionComponent = () => {
  usePageTitle('pageTitle.myMoney');
  // Opens on the whole history: an undefined start lets the backend begin at the first
  // price it has rather than a date the client would have to guess.
  const [period, setPeriod] = useState<{ from: string | undefined; to: string }>({
    from: undefined,
    to: moment().format('YYYY-MM-DD'),
  });

  const { data: portfolio, isLoading, isError } = usePortfolio(period.from, period.to);

  const onPeriodChange = useCallback((from: string | undefined, to: string) => {
    setPeriod({ from, to });
  }, []);

  if (isError) {
    return (
      <section className="mt-5">
        <div className="alert alert-danger">
          <FormattedMessage id="myMoney.pricesUnavailable" />
        </div>
      </section>
    );
  }

  if (isLoading || !portfolio) {
    return (
      <section className="mt-5">
        <Shimmer height={32} />
      </section>
    );
  }

  return (
    <section className="mt-5">
      <h1 className="mb-1">
        <FormattedMessage id="myMoney.title" />
      </h1>
      <p className="text-body-secondary mb-4">
        <FormattedMessage id="myMoney.subtitle" />
      </p>

      <PortfolioView
        portfolio={portfolio}
        from={period.from}
        to={period.to}
        onPeriodChange={onPeriodChange}
      />
    </section>
  );
};
