import React, { useCallback, useState } from 'react';
import moment from 'moment';
import { FormattedMessage } from 'react-intl';
import { useFunds, useTransactions } from '../../common/apiHooks';
import { Shimmer } from '../../common/shimmer/Shimmer';
import { usePageTitle } from '../../common/usePageTitle';
import { useFundNavHistories } from './api/navHistory.api';
import { PortfolioView } from './PortfolioView';

// Prices are fetched from before the period so the opening day already has one, otherwise
// the period would open at zero and report the whole starting balance as growth.
const PRICE_LOOKBACK_MONTHS = 3;

export const PortfolioPage: React.FunctionComponent = () => {
  usePageTitle('pageTitle.myMoney');
  // Left unset until the person picks a period, so the default can follow the transactions
  // once they arrive rather than being fixed on the first render.
  const [chosenPeriod, setChosenPeriod] = useState<{ from: string; to: string } | null>(null);

  const { data: transactions = [], isLoading: transactionsLoading } = useTransactions();
  const { data: funds = [], isLoading: fundsLoading } = useFunds();

  const heldIsins = funds
    .map((fund) => fund.isin)
    .filter((isin) => transactions.some((transaction) => transaction.isin === isin));

  const firstTransaction = transactions
    .filter((transaction) => heldIsins.includes(transaction.isin))
    .map((transaction) => moment(transaction.time).format('YYYY-MM-DD'))
    .sort()[0];

  const from =
    chosenPeriod?.from ?? firstTransaction ?? moment().startOf('year').format('YYYY-MM-DD');
  const to = chosenPeriod?.to ?? moment().format('YYYY-MM-DD');

  const {
    navHistoryByIsin,
    isLoading: navHistoryLoading,
    isError: navHistoryFailed,
  } = useFundNavHistories(
    heldIsins,
    moment(from).subtract(PRICE_LOOKBACK_MONTHS, 'month').format('YYYY-MM-DD'),
    to,
  );

  const onPeriodChange = useCallback((nextFrom: string, nextTo: string) => {
    setChosenPeriod({ from: nextFrom, to: nextTo });
  }, []);

  // Without every held fund's prices the totals would silently understate the balance.
  if (navHistoryFailed) {
    return (
      <section className="mt-5">
        <div className="alert alert-danger">
          <FormattedMessage id="myMoney.pricesUnavailable" />
        </div>
      </section>
    );
  }

  if (
    transactionsLoading ||
    fundsLoading ||
    navHistoryLoading ||
    !Array.isArray(transactions) ||
    !Array.isArray(funds)
  ) {
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
        transactions={transactions}
        funds={funds}
        navHistoryByIsin={navHistoryByIsin}
        from={from}
        to={to}
        onPeriodChange={onPeriodChange}
      />
    </section>
  );
};
