import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, Redirect, useParams } from 'react-router-dom';
import { useFunds, useMe, useTransactions } from '../../common/apiHooks';
import { Euro } from '../../common/Euro';
import { Shimmer } from '../../common/shimmer/Shimmer';
import { dayInTallinn, formatDateYear, timeInTallinn } from '../../common/dateFormatter';
import { usePageTitle } from '../../common/usePageTitle';
import { Fund, User } from '../../common/apiModels';
import { getBankName } from '../../common/iban';

const NAV_SCALE_BY_ISIN: Record<string, number> = {
  EE3600109435: 5, // TUK75
  EE3600109443: 5, // TUK00
  EE3600001707: 4, // TUV100
  EE0000003283: 4, // TKF100
};

const MIN_NAV_SCALE = 5;
const MIN_UNIT_SCALE = 3;

function decimalPlaces(n: number): number {
  const str = String(n);
  const dotIndex = str.indexOf('.');
  return dotIndex === -1 ? 0 : str.length - dotIndex - 1;
}

function navScaleFor(transaction: { isin: string; nav: number }): number {
  const known = NAV_SCALE_BY_ISIN[transaction.isin];
  if (known !== undefined) {
    return known;
  }
  return Math.max(MIN_NAV_SCALE, decimalPlaces(transaction.nav));
}

function unitScaleFor(units: number): number {
  return Math.max(MIN_UNIT_SCALE, decimalPlaces(units));
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

function unitHolderName(user?: User): string | null {
  if (!user) {
    return null;
  }
  return user.role?.name ?? `${user.firstName} ${user.lastName}`;
}

export const TransactionDetailPage: React.FunctionComponent = () => {
  usePageTitle('pageTitle.transactionDetail');

  const { id } = useParams<{ id: string }>();
  const { data: transactions, isLoading: transactionsLoading } = useTransactions();
  const { data: funds = [], isLoading: fundsLoading } = useFunds();
  const { data: user, isLoading: userLoading } = useMe();

  if (transactionsLoading || fundsLoading || userLoading) {
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
  const isRedemption = transaction.type === 'SUBTRACTION';
  const holder = unitHolderName(user);
  const bankName = transaction.counterpartyIban && getBankName(transaction.counterpartyIban);

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
      <dl className="row text-pretty">
        <dt className="col-sm-4 mb-sm-2 text-balance">
          <FormattedMessage id="transactions.detail.type" />
        </dt>
        <dd className="col-sm-8">
          {isRedemption ? (
            <FormattedMessage id="transactions.detail.type.redemption" />
          ) : (
            <FormattedMessage id="transactions.detail.type.subscription" />
          )}
        </dd>

        <dt className="col-sm-4 mb-sm-2 text-balance">
          <FormattedMessage id="transactions.detail.fund" />
        </dt>
        <dd className="col-sm-8">{fund?.name ?? transaction.isin}</dd>

        <dt className="col-sm-4 mb-sm-2 text-balance">
          <FormattedMessage id="transactions.detail.amount" />
        </dt>
        <dd className="col-sm-8">
          <Euro amount={transaction.amount} />
        </dd>

        {transaction.units != null && (
          <>
            <dt className="col-sm-4 mb-sm-2 text-balance">
              <FormattedMessage id="transactions.detail.units" />
            </dt>
            <dd className="col-sm-8">
              {transaction.units.toFixed(unitScaleFor(transaction.units))}
            </dd>
          </>
        )}

        {transaction.nav != null && (
          <>
            <dt className="col-sm-4 mb-sm-2 text-balance">
              <FormattedMessage id="transactions.detail.nav" />
            </dt>
            <dd className="col-sm-8">
              <Euro amount={transaction.nav} fractionDigits={navScaleFor(transaction)} />
            </dd>
          </>
        )}

        {isSavingsFund && transaction.priceCalculationDate && (
          <>
            <dt className="col-sm-4 mb-sm-2 text-balance">
              <FormattedMessage id="transactions.detail.priceCalculationDate" />
            </dt>
            <dd className="col-sm-8">{formatDateYear(transaction.priceCalculationDate)}</dd>
          </>
        )}

        {isSavingsFund && transaction.applicationTime && (
          <>
            <dt className="col-sm-4 mb-sm-2 text-balance">
              <FormattedMessage id="transactions.detail.applicationTime" />
            </dt>
            <dd className="col-sm-8">
              <FormattedMessage
                id="transactions.detail.applicationTime.value"
                values={{
                  date: formatDateYear(dayInTallinn(transaction.applicationTime)),
                  time: timeInTallinn(transaction.applicationTime),
                }}
              />
            </dd>
          </>
        )}

        <dt className="col-sm-4 mb-sm-2 text-balance">
          <FormattedMessage
            id={isSavingsFund ? 'transactions.detail.executionDate' : 'transactions.detail.date'}
          />
        </dt>
        <dd className="col-sm-8">{formatDateYear(dayInTallinn(transaction.time))}</dd>

        {isSavingsFund && (
          <>
            <dt className="col-sm-4 mb-sm-2 text-balance">
              <FormattedMessage id="transactions.detail.paymentMethod" />
            </dt>
            <dd className="col-sm-8">
              {transaction.counterpartyIban ? (
                <>
                  <FormattedMessage
                    id={
                      isRedemption
                        ? 'transactions.detail.paymentMethod.toAccount'
                        : 'transactions.detail.paymentMethod.fromAccount'
                    }
                    values={{ iban: transaction.counterpartyIban }}
                  />
                  {bankName && <div className="text-secondary">{bankName}</div>}
                </>
              ) : (
                <FormattedMessage id="transactions.detail.paymentMethod.bankTransfer" />
              )}
            </dd>
          </>
        )}

        {isSavingsFund && (
          <>
            <dt className="col-sm-4 mb-sm-2 text-balance">
              <FormattedMessage id="transactions.detail.fees" />
            </dt>
            <dd className="col-sm-8">
              <Euro amount={0} />
            </dd>
          </>
        )}

        {isSavingsFund && holder && (
          <>
            <dt className="col-sm-4 mb-sm-2 text-balance">
              <FormattedMessage id="transactions.detail.unitHolder" />
            </dt>
            <dd className="col-sm-8">{holder}</dd>
          </>
        )}

        {isSavingsFund && (
          <>
            <dt className="col-sm-4 mb-sm-2 text-balance">
              <FormattedMessage id="transactions.detail.fundManager" />
            </dt>
            <dd className="col-sm-8">
              <FormattedMessage id="transactions.detail.fundManager.value" />
            </dd>
          </>
        )}
      </dl>
    </section>
  );
};
