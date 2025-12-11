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
import { TableColumn } from '../../common/table/Table';

export const TransactionSection: React.FunctionComponent<{
  limit?: number;
  pillar?: number;
  children?: React.ReactNode;
}> = ({ limit, pillar, children }) => {
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

  if (pillar) {
    fundTransactions = fundTransactions.filter((transaction) => transaction.pillar === pillar);
  }

  const amountSum = sumBy(fundTransactions, (transaction) => transaction.amount);

  const columns: TableColumn[] = [
    {
      title: <FormattedMessage id="transactions.columns.date.title" />,
      dataIndex: 'date',
      align: 'right',
      ...(!limit && { footer: <FormattedMessage id="transactions.columns.date.footer" /> }),
    },
    {
      title: <FormattedMessage id="transactions.columns.entity.title" />,
      dataIndex: 'type',
      align: 'left',
      hideOnBreakpoint: ['xs', 'sm'],
    },
    {
      title: <FormattedMessage id="transactions.columns.fund.title" />,
      dataIndex: 'fund',
      width: 100,
      align: 'left',
    },
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
          date: <span className="text-nowrap">{date}</span>,
          fund: <span>{transaction.fundName}</span>,
          amount: <Euro amount={transaction.amount} />,
          key: transaction.time,
        },
      ];
    });

  if (limit) {
    dataSource = dataSource.slice(0, limit);
  }

  return (
    <section className="mt-5">
      {!pillar ? (
        <div className="mt-5 mb-4 d-flex flex-wrap column-gap-3 row-gap-2 align-items-baseline justify-content-between">
          <h2 className="m-0">{children || <FormattedMessage id="transactions.title" />}</h2>
          <Link className="icon-link" to="/2nd-pillar-transactions">
            <FormattedMessage id="transactions.seeAll" />
          </Link>
        </div>
      ) : (
        <div className="mt-5 mb-4 d-flex flex-md-row flex-column align-items-baseline justify-content-between">
          <h2 className="m-0">{children || <FormattedMessage id="transactions.title" />}</h2>
          <div className="d-flex gap-3">
            {pillar === 2 && (
              <Link className="icon-link" to="/3rd-pillar-transactions">
                <FormattedMessage id="transactions.seeAll.3" />
              </Link>
            )}
            {pillar === 3 && (
              <Link className="icon-link" to="/2nd-pillar-transactions">
                <FormattedMessage id="transactions.seeAll.2" />
              </Link>
            )}
            {!limit && (
              <Link className="icon-link" to="/account">
                <FormattedMessage id="transactions.backToAccountPage" />
              </Link>
            )}
          </div>
        </div>
      )}
      <Table columns={columns} dataSource={dataSource} />
    </section>
  );
};
