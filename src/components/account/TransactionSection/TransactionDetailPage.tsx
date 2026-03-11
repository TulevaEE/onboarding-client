import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, Redirect, useParams } from 'react-router-dom';
import { useFunds, useTransactions } from '../../common/apiHooks';
import { Euro } from '../../common/Euro';
import { Shimmer } from '../../common/shimmer/Shimmer';
import { formatDateYear } from '../../common/dateFormatter';
import { usePageTitle } from '../../common/usePageTitle';
import { Fund } from '../../common/apiModels';

function decimalPlaces(n: number): number {
  const str = String(n);
  const dotIndex = str.indexOf('.');
  return dotIndex === -1 ? 0 : str.length - dotIndex - 1;
}

function getBackPath(fund?: Fund): string {
  if (fund?.pillar === 2) {
    return '/2nd-pillar-transactions';
  }
  if (fund?.pillar === 3) {
    return '/3rd-pillar-transactions';
  }
  if (fund?.pillar === null) {
    return '/savings-fund-transactions';
  }
  return '/account';
}

export const TransactionDetailPage: React.FunctionComponent = () => {
  usePageTitle('pageTitle.transactionDetail');

  const { id } = useParams<{ id: string }>();
  const { data: transactions, isLoading: transactionsLoading } = useTransactions();
  const { data: funds = [], isLoading: fundsLoading } = useFunds();

  if (transactionsLoading || fundsLoading) {
    return (
      <section className="mt-5">
        <Shimmer height={200} />
      </section>
    );
  }

  const transaction = transactions?.find((t) => t.id === id);

  if (!transaction) {
    return <Redirect to="/account" />;
  }

  const fund = funds.find((f) => f.isin === transaction.isin);
  const isSavingsFund = fund?.pillar === null;

  return (
    <section className="mt-5">
      <div className="mt-5 mb-4 d-flex flex-sm-row flex-column align-items-baseline justify-content-between">
        <h2 className="m-0">
          <FormattedMessage id="transactions.detail.title" />
        </h2>
        <Link className="icon-link" to={getBackPath(fund)}>
          <FormattedMessage id="transactions.detail.back" />
        </Link>
      </div>
      <dl className="row">
        <dt className="col-sm-2">
          <FormattedMessage id="transactions.detail.date" />
        </dt>
        <dd className="col-sm-10">{formatDateYear(transaction.time)}</dd>

        <dt className="col-sm-2">
          <FormattedMessage id="transactions.detail.fund" />
        </dt>
        <dd className="col-sm-10">{fund?.name ?? transaction.isin}</dd>

        <dt className="col-sm-2">
          <FormattedMessage id="transactions.detail.type" />
        </dt>
        <dd className="col-sm-10">
          {transaction.type === 'SUBTRACTION' ? (
            <FormattedMessage id="transactions.detail.type.redemption" />
          ) : (
            <FormattedMessage id="transactions.detail.type.subscription" />
          )}
        </dd>

        <dt className="col-sm-2">
          <FormattedMessage id="transactions.detail.amount" />
        </dt>
        <dd className="col-sm-10">
          <Euro amount={transaction.amount} />
        </dd>

        {transaction.nav != null && (
          <>
            <dt className="col-sm-2">
              <FormattedMessage id="transactions.detail.nav" />
            </dt>
            <dd className="col-sm-10">
              <Euro
                amount={transaction.nav}
                fractionDigits={isSavingsFund ? 4 : Math.max(3, decimalPlaces(transaction.nav))}
              />
            </dd>
          </>
        )}

        {transaction.units != null && (
          <>
            <dt className="col-sm-2">
              <FormattedMessage id="transactions.detail.units" />
            </dt>
            <dd className="col-sm-10">
              {transaction.units.toFixed(
                isSavingsFund ? 3 : Math.max(3, decimalPlaces(transaction.units)),
              )}
            </dd>
          </>
        )}
      </dl>
    </section>
  );
};
