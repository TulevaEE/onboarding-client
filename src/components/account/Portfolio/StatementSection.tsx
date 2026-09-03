import React from 'react';
import download from 'downloadjs';
import moment from 'moment';
import { FormattedMessage, useIntl } from 'react-intl';
import { useFunds, useMe, useTransactions } from '../../common/apiHooks';
import { Euro } from '../../common/Euro';
import Table from '../../common/table';
import { formatAmountForCount, isActingAsSelf } from '../../common/utils';
import { PortfolioGroupSummary, Transaction, User } from '../../common/apiModels';
import styles from './Statement.module.scss';

// The register reports units as positive numbers on both directions; the sign lives in
// the transaction type. Everything below works on signed units so balances add up.
const signedUnits = (transaction: Transaction): number =>
  transaction.type === 'SUBTRACTION' ? -transaction.units : transaction.units;

const onDate = (transaction: Transaction): string => transaction.time.slice(0, 10);

// No computed cost basis or realised gain anywhere here: choosing FIFO or weighted
// average is the account owner's accounting policy, not ours to make for them.
export const StatementSection: React.FunctionComponent<{
  summary: PortfolioGroupSummary;
  from: string;
  to: string;
}> = ({ summary, from, to }) => {
  const { formatMessage } = useIntl();
  const { data: transactions, isLoading: transactionsLoading } = useTransactions();
  const { data: funds, isLoading: fundsLoading } = useFunds();
  const { data: user } = useMe();

  // Absent rows are not an empty statement: while the answers are loading, or when one
  // never comes, there is no section — not a document claiming the period had nothing.
  if (transactionsLoading || fundsLoading || !transactions || !funds || !user) {
    return <></>;
  }

  // The savings fund is the fund the pension registry does not know: it has no pillar.
  const savingsFunds = funds.filter((fund) => fund.pillar === null);
  const savingsFund = savingsFunds[0];
  const savingsIsins = new Set(savingsFunds.map((fund) => fund.isin));

  const allSavingsTransactions = transactions
    .filter((transaction) => savingsIsins.has(transaction.isin))
    .sort((first, second) => first.time.localeCompare(second.time));

  const openingUnits = allSavingsTransactions
    .filter((transaction) => onDate(transaction) < from)
    .reduce((sum, transaction) => sum + signedUnits(transaction), 0);
  const closingUnits = allSavingsTransactions
    .filter((transaction) => onDate(transaction) <= to)
    .reduce((sum, transaction) => sum + signedUnits(transaction), 0);

  const periodTransactions = allSavingsTransactions.filter(
    (transaction) => onDate(transaction) >= from && onDate(transaction) <= to,
  );

  const unitsSum = periodTransactions.reduce(
    (sum, transaction) => sum + signedUnits(transaction),
    0,
  );
  const amountSum = periodTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);

  const typeLabel = (transaction: Transaction): string =>
    formatMessage({
      id:
        transaction.type === 'SUBTRACTION'
          ? 'savingsFund.statement.transactions.redemption'
          : 'savingsFund.statement.transactions.contribution',
    });

  const downloadCsv = () => {
    // Semicolon-separated with comma decimals: what Estonian-locale Excel opens into
    // columns without an import dialog. The BOM tells it the file is UTF-8.
    const number = (value: number, fractionDigits: number) =>
      value.toFixed(fractionDigits).replace('.', ',');
    const header = [
      formatMessage({ id: 'savingsFund.statement.transactions.date' }),
      formatMessage({ id: 'savingsFund.statement.transactions.type' }),
      formatMessage({ id: 'savingsFund.statement.transactions.units' }),
      formatMessage({ id: 'savingsFund.statement.transactions.nav' }),
      formatMessage({ id: 'savingsFund.statement.transactions.amount' }),
    ];
    const rows = periodTransactions.map((transaction) => [
      moment(transaction.time).format('DD.MM.YYYY'),
      typeLabel(transaction),
      number(signedUnits(transaction), 4),
      number(transaction.nav, 5),
      number(transaction.amount, 2),
    ]);
    const csv = [header, ...rows].map((row) => row.join(';')).join('\r\n');
    download(`\ufeff${csv}`, `tuleva-kogumisfondi-valjavote-${from}-${to}.csv`, 'text/csv');
  };

  const dataSource = [...periodTransactions].reverse().map((transaction) => ({
    date: <span className="text-nowrap">{moment(transaction.time).format('DD.MM.YYYY')}</span>,
    type: typeLabel(transaction),
    units: formatAmountForCount(signedUnits(transaction), 4),
    nav: formatAmountForCount(transaction.nav, 5),
    amount: <Euro amount={transaction.amount} />,
    key: transaction.id ?? transaction.time,
  }));

  const columns = [
    {
      title: <FormattedMessage id="savingsFund.statement.transactions.date" />,
      dataIndex: 'date',
      align: 'right' as const,
      ...(dataSource.length > 0 && {
        footer: <FormattedMessage id="transactions.columns.date.footer" />,
      }),
    },
    {
      title: <FormattedMessage id="savingsFund.statement.transactions.type" />,
      dataIndex: 'type',
      align: 'left' as const,
    },
    {
      title: <FormattedMessage id="savingsFund.statement.transactions.units" />,
      dataIndex: 'units',
      ...(dataSource.length > 0 && { footer: formatAmountForCount(unitsSum, 4) }),
    },
    {
      title: <FormattedMessage id="savingsFund.statement.transactions.nav" />,
      dataIndex: 'nav',
    },
    {
      title: <FormattedMessage id="savingsFund.statement.transactions.amount" />,
      dataIndex: 'amount',
      ...(dataSource.length > 0 && { footer: <Euro amount={amountSum} /> }),
    },
  ];

  const owner = statementOwner(user);

  return (
    <>
      <section className="mt-5">
        <div className="mb-4 d-flex flex-wrap column-gap-3 row-gap-2 align-items-baseline justify-content-between">
          <h2 className="m-0">
            <FormattedMessage id="savingsFund.statement.transactions.heading" />
          </h2>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() => window.print()}
            >
              <FormattedMessage id="savingsFund.statement.export.pdf" />
            </button>
            <button type="button" className="btn btn-outline-primary" onClick={downloadCsv}>
              <FormattedMessage id="savingsFund.statement.export.csv" />
            </button>
          </div>
        </div>
        {dataSource.length > 0 ? (
          <Table columns={columns} dataSource={dataSource} />
        ) : (
          <p className="text-body-secondary">
            <FormattedMessage id="savingsFund.statement.transactions.none" />
          </p>
        )}
      </section>

      <div className={styles.printOnly}>
        <h1 className="h3 mb-4">
          <FormattedMessage id="savingsFund.statement.document.title" />
        </h1>
        <table className="table table-sm mb-4">
          <tbody>
            <tr>
              <th scope="row">
                <FormattedMessage id="savingsFund.statement.document.owner" />
              </th>
              <td>{owner.name}</td>
            </tr>
            <tr>
              <th scope="row">
                <FormattedMessage id={owner.codeLabel} />
              </th>
              <td>{owner.code}</td>
            </tr>
            {savingsFund && (
              <tr>
                <th scope="row">
                  <FormattedMessage id="savingsFund.statement.document.fund" />
                </th>
                <td>
                  {savingsFund.name} ({savingsFund.isin})
                </td>
              </tr>
            )}
            <tr>
              <th scope="row">
                <FormattedMessage id="savingsFund.statement.document.period" />
              </th>
              <td>
                {moment(from).format('DD.MM.YYYY')}–{moment(to).format('DD.MM.YYYY')}
              </td>
            </tr>
          </tbody>
        </table>

        <table className="table table-sm">
          <thead>
            <tr>
              <th scope="col">
                <FormattedMessage id="savingsFund.statement.transactions.date" />
              </th>
              <th scope="col">
                <FormattedMessage id="savingsFund.statement.transactions.type" />
              </th>
              <th scope="col" className="text-end">
                <FormattedMessage id="savingsFund.statement.transactions.units" />
              </th>
              <th scope="col" className="text-end">
                <FormattedMessage id="savingsFund.statement.transactions.nav" />
              </th>
              <th scope="col" className="text-end">
                <FormattedMessage id="savingsFund.statement.transactions.amount" />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={2}>
                <FormattedMessage
                  id="savingsFund.statement.document.opening"
                  values={{ date: moment(from).format('DD.MM.YYYY') }}
                />
              </td>
              <td className="text-end">{formatAmountForCount(openingUnits, 4)}</td>
              <td colSpan={2} className="text-end">
                {summary.startValue !== null && <Euro amount={summary.startValue} />}
              </td>
            </tr>
            {periodTransactions.map((transaction) => (
              <tr key={transaction.id ?? transaction.time}>
                <td>{moment(transaction.time).format('DD.MM.YYYY')}</td>
                <td>{typeLabel(transaction)}</td>
                <td className="text-end">{formatAmountForCount(signedUnits(transaction), 4)}</td>
                <td className="text-end">{formatAmountForCount(transaction.nav, 5)}</td>
                <td className="text-end">
                  <Euro amount={transaction.amount} />
                </td>
              </tr>
            ))}
            <tr className="fw-bold">
              <td colSpan={2}>
                <FormattedMessage
                  id="savingsFund.statement.document.closing"
                  values={{ date: moment(to).format('DD.MM.YYYY') }}
                />
              </td>
              <td className="text-end">{formatAmountForCount(closingUnits, 4)}</td>
              <td colSpan={2} className="text-end">
                {summary.endValue !== null && <Euro amount={summary.endValue} />}
              </td>
            </tr>
          </tbody>
        </table>

        <p className="text-body-secondary small">
          <FormattedMessage
            id="savingsFund.statement.document.generated"
            values={{ date: moment().format('DD.MM.YYYY') }}
          />
        </p>
      </div>
    </>
  );
};

// The document names whoever the account belongs to: the company or child someone is
// acting for, or the person themselves.
const statementOwner = (
  user: User,
): {
  name: string;
  code: string;
  codeLabel:
    | 'savingsFund.statement.document.personalCode'
    | 'savingsFund.statement.document.registryCode';
} => {
  if (user.role && !isActingAsSelf(user)) {
    return {
      name: user.role.name,
      code: user.role.code,
      codeLabel:
        user.role.type === 'LEGAL_ENTITY'
          ? 'savingsFund.statement.document.registryCode'
          : 'savingsFund.statement.document.personalCode',
    };
  }
  return {
    name: `${user.firstName} ${user.lastName}`,
    code: user.personalCode,
    codeLabel: 'savingsFund.statement.document.personalCode',
  };
};
