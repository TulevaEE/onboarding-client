import React from 'react';
import { captureException } from '@sentry/browser';

import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import sumBy from 'lodash/sumBy';
import { useFunds, useTransactions } from '../../common/apiHooks';
import Table from '../../common/table';
import { Euro } from '../../common/Euro';
import { Shimmer } from '../../common/shimmer/Shimmer';
import { formatDate } from '../../common/dateFormatter';
import { formatAmountForCount } from '../../common/utils';
import { Breakpoint, TableColumn } from '../../common/table/Table';
import { getOtherTransactionPages } from './getOtherTransactionPages';

export const TransactionSection: React.FunctionComponent<{
  limit?: number;
  pillar?: number | null;
  children?: React.ReactNode;
  allTransactionsPath?: string;
}> = ({ limit, pillar, children, allTransactionsPath }) => {
  const { data: transactions = [], isLoading: transactionsLoading } = useTransactions();
  const { data: funds = [], isLoading: fundsLoading } = useFunds();

  if (!Array.isArray(transactions) || !Array.isArray(funds)) {
    captureException(
      new Error(
        `TransactionSection received non-array data: transactionsType=${typeof transactions}, fundsType=${typeof funds}, transactions=${JSON.stringify(
          transactions,
        )?.slice(0, 200)}, funds=${JSON.stringify(funds)?.slice(0, 200)}`,
      ),
    );
  }

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

  if (!funds.length) {
    return <></>;
  }

  let fundTransactions = transactions.map((transaction) => {
    const fund = funds.find((fnd) => fnd.isin === transaction.isin);
    return {
      ...transaction,
      fundName: fund?.name,
      pillar: fund?.pillar,
    };
  });

  if (pillar !== undefined) {
    fundTransactions = fundTransactions.filter((transaction) => transaction.pillar === pillar);
  }

  const otherPages = getOtherTransactionPages(pillar, funds);

  const amountSum = sumBy(fundTransactions, (transaction) => transaction.amount);

  const hasPensionTransactions = fundTransactions.some((transaction) => transaction.pillar);

  const unitsColumn = (() => {
    if (limit) {
      return [];
    }
    const allSameFund =
      fundTransactions.length > 0 && new Set(fundTransactions.map((t) => t.isin)).size === 1;
    const unitsSum = sumBy(fundTransactions, (transaction) =>
      transaction.type === 'SUBTRACTION' ? -(transaction.units ?? 0) : transaction.units ?? 0,
    );
    return [
      {
        title: <FormattedMessage id="transactions.columns.units.title" />,
        dataIndex: 'units',
        hideOnBreakpoint: ['xs', 'sm'] as Breakpoint[],
        ...(allSameFund && {
          footer: formatAmountForCount(unitsSum, 2),
        }),
      },
    ];
  })();

  const columns: TableColumn[] = [
    {
      title: <FormattedMessage id="transactions.columns.date.title" />,
      dataIndex: 'date',
      align: 'right',
      ...(!limit && { footer: <FormattedMessage id="transactions.columns.date.footer" /> }),
    },
    ...(hasPensionTransactions
      ? [
          {
            title: <FormattedMessage id="transactions.columns.entity.title" />,
            dataIndex: 'type',
            align: 'left' as const,
            hideOnBreakpoint: ['xs', 'sm'] as Breakpoint[],
          },
        ]
      : []),
    {
      title: <FormattedMessage id="transactions.columns.fund.title" />,
      dataIndex: 'fund',
      width: 100,
      align: 'left',
    },
    ...unitsColumn,
    {
      title: <FormattedMessage id="transactions.columns.amount.title" />,
      dataIndex: 'amount',
      ...(!limit && { footer: <Euro amount={amountSum} /> }),
    },
  ];

  let dataSource = fundTransactions
    .sort((transaction1, transaction2) => transaction2.time.localeCompare(transaction1.time))
    .flatMap((transaction, index) => {
      const previousTransaction = fundTransactions[index - 1];
      const previousYear = new Date(previousTransaction?.time || '9999-12-31').getUTCFullYear();
      const currentYear = new Date(transaction.time).getUTCFullYear();
      const date = formatDate(transaction.time);
      return [
        ...(!limit && previousYear > currentYear
          ? [
              {
                date: <strong>{currentYear}</strong>,
                key: currentYear.toString(),
              },
            ]
          : []),
        {
          type:
            transaction.type === 'CONTRIBUTION_CASH_WORKPLACE' ? (
              <FormattedMessage id="transactions.workplace" />
            ) : (
              <FormattedMessage id="transactions.personal" />
            ),
          date:
            !limit && transaction.id ? (
              <Link to={`/transaction/${transaction.id}`} className="text-nowrap">
                {date}
              </Link>
            ) : (
              <span className="text-nowrap">{date}</span>
            ),
          fund: <span>{transaction.fundName}</span>,
          ...(!limit &&
            transaction.units != null && {
              // Backend returns positive units for subtractions (unlike amounts which are negative).
              // Negate here to match the amount sign convention. Remove if backend starts returning signed units.
              units: formatAmountForCount(
                transaction.type === 'SUBTRACTION' ? -transaction.units : transaction.units,
                2,
              ),
            }),
          amount: <Euro amount={transaction.amount} />,
          key: transaction.time,
        },
      ];
    });

  if (limit) {
    dataSource = dataSource.slice(0, limit);
  }

  if (!dataSource.length && limit) {
    return <></>;
  }

  return (
    <section className="mt-5">
      {pillar === undefined ? (
        <div className="mt-5 mb-4 d-flex flex-wrap column-gap-3 row-gap-2 align-items-baseline justify-content-between">
          <h2 className="m-0">{children || <FormattedMessage id="transactions.title" />}</h2>
          <Link className="icon-link" to={allTransactionsPath ?? '/2nd-pillar-transactions'}>
            <FormattedMessage id="transactions.seeAll" />
          </Link>
        </div>
      ) : (
        <div className="mt-5 mb-4 d-flex flex-md-row flex-column align-items-baseline justify-content-between">
          <h2 className="m-0">{children || <FormattedMessage id="transactions.title" />}</h2>
          <div className="d-flex gap-3">
            {otherPages.map((page) => (
              <Link key={page.path} className="icon-link" to={page.path}>
                <FormattedMessage id={page.labelId} />
              </Link>
            ))}
          </div>
        </div>
      )}
      <Table columns={columns} dataSource={dataSource} />
    </section>
  );
};
