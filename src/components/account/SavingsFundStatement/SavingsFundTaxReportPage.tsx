import React from 'react';
import { FormattedMessage } from 'react-intl';
import { useFunds, useTransactions } from '../../common/apiHooks';
import { Shimmer } from '../../common/shimmer/Shimmer';
import { usePageTitle } from '../../common/usePageTitle';
import { TaxTab } from './TaxTab';

export const SavingsFundTaxReportPage: React.FunctionComponent = () => {
  usePageTitle('pageTitle.savingsFundTaxReport');

  const { data: transactions = [], isLoading: transactionsLoading } = useTransactions();
  const { data: funds = [], isLoading: fundsLoading } = useFunds();

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

  const savingsFundIsins = funds.filter((fund) => fund.pillar === null).map((fund) => fund.isin);
  const savingsFundTransactions = transactions.filter((transaction) =>
    savingsFundIsins.includes(transaction.isin),
  );

  return (
    <section className="mt-5">
      <h1 className="mb-1">
        <FormattedMessage id="savingsFundTaxReport.title" />
      </h1>
      <p className="text-body-secondary">
        <FormattedMessage id="savingsFundTaxReport.subtitle" />
      </p>
      <div className="alert alert-info mb-4">
        <FormattedMessage id="savingsFundTaxReport.pillarNote" />
      </div>

      <TaxTab transactions={savingsFundTransactions} />
    </section>
  );
};
