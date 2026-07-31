import React, { useCallback, useState } from 'react';
import moment from 'moment';
import { FormattedMessage } from 'react-intl';
import { useFunds, useTransactions } from '../../common/apiHooks';
import { NavValue } from '../../common/apiModels';
import { Shimmer } from '../../common/shimmer/Shimmer';
import { usePageTitle } from '../../common/usePageTitle';
import { MoneyTab } from './MoneyTab';
import { NavHistoryLoader } from './NavHistoryLoader';
import { NavHistoryByIsin } from './portfolio';

export const MyMoneyPage: React.FunctionComponent = () => {
  usePageTitle('pageTitle.myMoney');
  const [from, setFrom] = useState(moment().startOf('year').format('YYYY-MM-DD'));
  const [to, setTo] = useState(moment().format('YYYY-MM-DD'));
  const [navHistoryByIsin, setNavHistoryByIsin] = useState<NavHistoryByIsin>({});

  const { data: transactions = [], isLoading: transactionsLoading } = useTransactions();
  const { data: funds = [], isLoading: fundsLoading } = useFunds();

  const onNavLoaded = useCallback((isin: string, values: NavValue[]) => {
    setNavHistoryByIsin((current) =>
      current[isin] === values ? current : { ...current, [isin]: values },
    );
  }, []);

  const onPeriodChange = useCallback((nextFrom: string, nextTo: string) => {
    setFrom(nextFrom);
    setTo(nextTo);
  }, []);

  if (
    transactionsLoading ||
    fundsLoading ||
    !Array.isArray(transactions) ||
    !Array.isArray(funds)
  ) {
    return (
      <section className="mt-5">
        <Shimmer height={32} />
      </section>
    );
  }

  const heldIsins = funds
    .map((fund) => fund.isin)
    .filter((isin) => transactions.some((transaction) => transaction.isin === isin));

  return (
    <section className="mt-5">
      <NavHistoryLoader
        isins={heldIsins}
        from={moment(from).subtract(3, 'month').format('YYYY-MM-DD')}
        to={to}
        onLoaded={onNavLoaded}
      />

      <h1 className="mb-1">
        <FormattedMessage id="myMoney.title" />
      </h1>
      <p className="text-body-secondary mb-4">
        <FormattedMessage id="myMoney.subtitle" />
      </p>

      <MoneyTab
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
