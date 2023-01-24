import React from 'react';

import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import moment from 'moment/moment';
import { useFunds, useTransactions } from '../../common/apiHooks';
import Table from '../../common/table';
import Euro from '../../common/Euro';
import { Shimmer } from '../../common/shimmer/Shimmer';

export const TransactionSection: React.FunctionComponent<{
  limit?: number;
}> = ({ limit }) => {
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

  const columns = [
    {
      title: <FormattedMessage id="transactions.columns.date.title" />,
      dataIndex: 'date',
      align: 'right',
      hideOnMobile: true,
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
    },
  ];

  let dataSource = transactions
    .sort((transaction1, transaction2) => transaction2.time.localeCompare(transaction1.time))
    .map((transaction) => {
      const date = formatDate(transaction.time);
      const fund = funds.find((fnd) => fnd.isin === transaction.isin);
      return {
        date: <span className="text-nowrap">{date}</span>,
        fund: fund?.name,
        amount: <Euro amount={transaction.amount} />,
        key: transaction.time,
      };
    });

  if (limit) {
    dataSource = dataSource.slice(0, limit);
  }

  return (
    <section className="mt-5">
      <div className="d-flex justify-content-between">
        <h2 className="mb-4 lead">
          <FormattedMessage id="transactions.title" />
        </h2>
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
  const format = moment.localeData().longDateFormat('LL');
  return moment(date).format(format);
}
