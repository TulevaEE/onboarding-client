import React, { useCallback, useState } from 'react';
import moment from 'moment';
import { FormattedMessage } from 'react-intl';
import { Shimmer } from '../../common/shimmer/Shimmer';
import { usePageTitle } from '../../common/usePageTitle';
import { useMe, useSavingsFundBalance, useSourceFunds } from '../../common/apiHooks';
import { currentValueByGroup } from '../../common/balances';
import { usePortfolio } from './api/portfolio.api';
import { PeriodSelector } from './PeriodSelector';
import { PortfolioView } from './PortfolioView';

export const PortfolioPage: React.FunctionComponent = () => {
  usePageTitle('pageTitle.myMoney');
  // Opens on the whole history: an undefined start lets the backend begin at the first
  // price it has rather than a date the client would have to guess.
  const [period, setPeriod] = useState<{ from: string | undefined; to: string }>({
    from: undefined,
    to: moment().format('YYYY-MM-DD'),
  });

  const { data: portfolio, isLoading, isError, refetch } = usePortfolio(period.from, period.to);

  // Prices rebuild a value out of units, and money the register has not turned into units
  // yet has none. For a period that runs to today the register itself can be asked, so the
  // closing value is the one the account page shows rather than one short of it.
  //
  // A legal entity never holds a pillar, so it is not asked about one — the same request
  // the represented-party account page leaves out for a company.
  const { data: user } = useMe();
  const holdsPillars = user !== undefined && user.role?.type !== 'LEGAL_ENTITY';
  const pensionBalance = useSourceFunds(undefined, undefined, { enabled: holdsPillars });
  const savingsBalance = useSavingsFundBalance();

  // Half an answer is worse than none: a balance for one band beside a rebuilt value for
  // another adds up to a total from neither source, and nothing on the page would say so.
  const registerAnswered =
    (holdsPillars ? pensionBalance.isSuccess : user !== undefined) && savingsBalance.isSuccess;
  const currentValues =
    period.to === moment().format('YYYY-MM-DD') && registerAnswered
      ? currentValueByGroup(pensionBalance.data, savingsBalance.data)
      : undefined;

  const onPeriodChange = useCallback((from: string | undefined, to: string) => {
    setPeriod({ from, to });
  }, []);

  return (
    <section className="mt-5">
      <h1 className="mb-1">
        <FormattedMessage id="myMoney.title" />
      </h1>
      <p className="text-body-secondary mb-4">
        <FormattedMessage id="myMoney.subtitle" />
      </p>

      {isError && (
        <div className="alert alert-danger d-flex flex-wrap gap-3 align-items-center justify-content-between">
          <span>
            <FormattedMessage id="myMoney.pricesUnavailable" />
          </span>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => refetch()}>
            <FormattedMessage id="myMoney.retry" />
          </button>
        </div>
      )}

      {/* A period the backend refused leaves nothing to draw, so the period someone can
          change is shown on its own — otherwise the page stays broken until a reload. */}
      {portfolio ? (
        <PortfolioView
          portfolio={portfolio}
          from={period.from}
          to={period.to}
          currentValues={currentValues}
          onPeriodChange={onPeriodChange}
        />
      ) : (
        <>
          <div className="card p-4 mb-3">
            <PeriodSelector from={period.from} to={period.to} onPeriodChange={onPeriodChange} />
          </div>
          {isLoading && <Shimmer height={32} />}
        </>
      )}
    </section>
  );
};
