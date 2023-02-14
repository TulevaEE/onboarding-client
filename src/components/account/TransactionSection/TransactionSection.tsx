import React from 'react';

import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import moment from 'moment/moment';
import sumBy from 'lodash/sumBy';
import { useFunds, useTransactions } from '../../common/apiHooks';
import Table from '../../common/table';
import Euro from '../../common/Euro';
import { Shimmer } from '../../common/shimmer/Shimmer';

export const TransactionSection: React.FunctionComponent<{
  limit?: number;
  pillar?: number;
  children?: React.ReactNode;
}> = ({ limit, pillar, children }) => {
  const { data: transactions } = useTransactions();
  const { data: funds } = useFunds();

  if (!transactions || !funds) {
    return (
      <section className="mt-5">
        <Shimmer height={26} />
      </section>
    );
  }

  if (!transactions.length || !funds.length) {
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

  if (!fundTransactions.length) {
    return <></>;
  }

  const amountSum = sumBy(fundTransactions, (transaction) => transaction.amount);

  const columns = [
    {
      title: <FormattedMessage id="transactions.columns.date.title" />,
      dataIndex: 'date',
      align: 'right',
      ...(!limit && { footer: <FormattedMessage id="transactions.columns.date.footer" /> }),
    },
    {
      title: <FormattedMessage id="transactions.columns.fund.title" />,
      dataIndex: 'fund',
      width100: true,
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
      <div className="d-flex justify-content-between">
        <h2 className="mb-4 lead">{children || <FormattedMessage id="transactions.title" />}</h2>
        <div>
          {limit ? (
            <Link to="/transactions">
              <FormattedMessage id="transactions.seeAll" />
            </Link>
          ) : (
            <Link to="/account">
              <FormattedMessage id="transactions.backToAccountPage" />
            </Link>
          )}
        </div>
      </div>
      <Table columns={columns} dataSource={dataSource} />
    </section>
  );
};

function formatDate(date: string): string {
  const format = moment.locale() === 'et' ? 'D. MMMM' : 'MMMM D';
  return moment(date).format(format);
}
