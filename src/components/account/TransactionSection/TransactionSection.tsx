import React from 'react';

import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import sumBy from 'lodash/sumBy';
import { useFunds, useTransactions } from '../../common/apiHooks';
import Table from '../../common/table';
import { Euro } from '../../common/Euro';
import { Shimmer } from '../../common/shimmer/Shimmer';
import { formatDate } from '../../common/dateFormatter';

export const TransactionSection: React.FunctionComponent<{
  limit?: number;
  pillar?: number;
  children?: React.ReactNode;
}> = ({ limit, pillar, children }) => {
  const intl = useIntl();
  const { data: transactions } = useTransactions();
  const { data: funds } = useFunds();

  if (!transactions || !funds) {
    return (
      <section className="mt-5">
        <Shimmer height={26} />
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

  const columns = [
    {
      title: <FormattedMessage id="transactions.columns.date.title" />,
      dataIndex: 'date',
      align: 'right',
      ...(!limit && { footer: <FormattedMessage id="transactions.columns.date.footer" /> }),
    },
    {
      title: <></>,
      dataIndex: 'type',
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
              <span
                className="fa fa-briefcase text-muted"
                title={intl.formatMessage({ id: 'transactions.workplace' })}
              />
            ) : (
              <span
                className="fa fa-user-o text-muted"
                title={intl.formatMessage({ id: 'transactions.personal' })}
              />
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
        <div className="d-flex flex-row justify-content-between">
          <h2 className="mb-4 lead">{children || <FormattedMessage id="transactions.title" />}</h2>
          <Link className="text-nowrap" to="/2nd-pillar-transactions">
            <FormattedMessage id="transactions.seeAll" />
          </Link>
        </div>
      ) : (
        <div className="d-flex flex-md-row flex-column align-items-md-end justify-content-between">
          <h2 className="mb-4 lead">{children || <FormattedMessage id="transactions.title" />}</h2>
          <div className="ms-md-2 text-nowrap mb-4">
            {pillar === 2 && (
              <Link className="text-nowrap" to="/3rd-pillar-transactions">
                <FormattedMessage id="transactions.seeAll.3" />
              </Link>
            )}
            {pillar === 3 && (
              <Link className="text-nowrap" to="/2nd-pillar-transactions">
                <FormattedMessage id="transactions.seeAll.2" />
              </Link>
            )}
            {!limit && (
              <>
                {' '}
                <span className="mx-2">·</span>{' '}
                <Link to="/account">
                  <FormattedMessage id="transactions.backToAccountPage" />
                </Link>
              </>
            )}
          </div>
        </div>
      )}
      <Table columns={columns} dataSource={dataSource} />
    </section>
  );
};
