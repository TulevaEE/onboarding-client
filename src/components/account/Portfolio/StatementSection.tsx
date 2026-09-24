import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import download from 'downloadjs';
import moment from 'moment';
import { FormattedMessage, useIntl } from 'react-intl';
import { useFunds, useMe, useTransactions } from '../../common/apiHooks';
import { Euro } from '../../common/Euro';
import Table from '../../common/table';
import { formatAmountForCount, isActingAsSelf } from '../../common/utils';
import { dayInTallinn, formatDayInTallinn } from '../../common/dateFormatter';
import { Fund, PortfolioGroupSummary, Transaction, User } from '../../common/apiModels';
import { TranslationKey } from '../../translations';
import styles from './Statement.module.scss';

const isRedemption = (transaction: Transaction): boolean => transaction.type === 'SUBTRACTION';

const signedUnits = (transaction: Transaction): number =>
  isRedemption(transaction) ? -transaction.units : transaction.units;

const onDate = (transaction: Transaction): string => dayInTallinn(transaction.time);

const withRunningBalance = (
  transactions: Transaction[],
  startingUnits: number,
): { transaction: Transaction; balanceUnits: number }[] => {
  let balanceUnits = startingUnits;
  return transactions.map((transaction) => {
    balanceUnits += signedUnits(transaction);
    return { transaction, balanceUnits };
  });
};

const isSavingsFund = (fund: Fund): boolean => fund.pillar === null;

const UTF8_BYTE_ORDER_MARK = '\ufeff';
const ESTONIAN_EXCEL_COLUMN_SEPARATOR = ';';

type DocumentRow = {
  key: string;
  label: string;
  type?: string;
  units?: number;
  nav?: number;
  amount?: number;
  balanceUnits?: number;
  balanceValue?: number | null;
  isClosing?: boolean;
};

type FigureColumn = {
  field: 'units' | 'nav' | 'amount' | 'balanceUnits' | 'balanceValue';
  heading: TranslationKey;
  fractionDigits: number;
  isEuro: boolean;
};

const textColumnHeadings: TranslationKey[] = [
  'savingsFund.statement.transactions.date',
  'savingsFund.statement.transactions.type',
];

const figureColumns: FigureColumn[] = [
  {
    field: 'units',
    heading: 'savingsFund.statement.transactions.units',
    fractionDigits: 4,
    isEuro: false,
  },
  {
    field: 'nav',
    heading: 'savingsFund.statement.transactions.nav',
    fractionDigits: 5,
    isEuro: false,
  },
  {
    field: 'amount',
    heading: 'savingsFund.statement.transactions.amount',
    fractionDigits: 2,
    isEuro: true,
  },
  {
    field: 'balanceUnits',
    heading: 'savingsFund.statement.document.balanceUnits',
    fractionDigits: 4,
    isEuro: false,
  },
  {
    field: 'balanceValue',
    heading: 'savingsFund.statement.document.balanceValue',
    fractionDigits: 2,
    isEuro: true,
  },
];

const documentColumnHeadings: TranslationKey[] = [
  ...textColumnHeadings,
  ...figureColumns.map(({ heading }) => heading),
];

const withoutMinusZero = (rounded: string): string =>
  Number(rounded) === 0 ? rounded.replace('-', '') : rounded;

const csvFigure = (value: number | null | undefined, fractionDigits: number): string =>
  value === null || value === undefined
    ? ''
    : withoutMinusZero(value.toFixed(fractionDigits)).replace('.', ',');

const csvCells = (row: DocumentRow): string[] => [
  row.label,
  row.type ?? '',
  ...figureColumns.map(({ field, fractionDigits }) => csvFigure(row[field], fractionDigits)),
];

const printedFigure = (
  value: number | null | undefined,
  { fractionDigits, isEuro }: FigureColumn,
): React.ReactNode => {
  if (value === null || value === undefined) {
    return null;
  }
  return isEuro ? (
    <Euro amount={value} fractionDigits={fractionDigits} />
  ) : (
    formatAmountForCount(value, fractionDigits)
  );
};

const firstFigureColumn = (row: DocumentRow): number =>
  figureColumns.findIndex(({ field }) => row[field] !== undefined);

const DocumentTableRow: React.FunctionComponent<{ row: DocumentRow }> = ({ row }) => {
  const figuresFrom = firstFigureColumn(row);
  return (
    <tr className={row.isClosing ? 'fw-bold' : undefined}>
      {row.type === undefined ? (
        <td colSpan={textColumnHeadings.length + figuresFrom}>{row.label}</td>
      ) : (
        <>
          <td>{row.label}</td>
          <td>{row.type}</td>
        </>
      )}
      {figureColumns.slice(figuresFrom).map((column) => (
        <td key={column.field} className="text-end">
          {printedFigure(row[column.field], column)}
        </td>
      ))}
    </tr>
  );
};

const DocumentTable: React.FunctionComponent<{ rows: DocumentRow[] }> = ({ rows }) => (
  <table className="table table-sm">
    <thead>
      <tr>
        {textColumnHeadings.map((heading) => (
          <th key={heading} scope="col">
            <FormattedMessage id={heading} />
          </th>
        ))}
        {figureColumns.map(({ field, heading }) => (
          <th key={field} scope="col" className="text-end">
            <FormattedMessage id={heading} />
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map((row) => (
        <DocumentTableRow key={row.key} row={row} />
      ))}
    </tbody>
  </table>
);

export const StatementSection: React.FunctionComponent<{
  summary: PortfolioGroupSummary;
  from: string;
  to: string;
  exportable: boolean;
}> = ({ summary, from, to, exportable }) => {
  const { formatMessage } = useIntl();
  const { data: transactions, isLoading: transactionsLoading } = useTransactions();
  const { data: funds, isLoading: fundsLoading } = useFunds();
  const { data: user } = useMe();

  if (transactionsLoading || fundsLoading || !transactions || !funds || !user) {
    return <></>;
  }

  const savingsFunds = funds.filter(isSavingsFund);
  const savingsFund = savingsFunds[0];

  if (!savingsFund) {
    return <></>;
  }

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

  const contributionsTotal = periodTransactions
    .filter((transaction) => !isRedemption(transaction))
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const withdrawalsTotal = periodTransactions
    .filter(isRedemption)
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const valueChange =
    summary.startValue === null || summary.endValue === null
      ? null
      : summary.endValue - summary.startValue - contributionsTotal - withdrawalsTotal;

  const typeLabel = (transaction: Transaction): string =>
    formatMessage({
      id: isRedemption(transaction)
        ? 'savingsFund.statement.transactions.redemption'
        : 'savingsFund.statement.transactions.contribution',
    });

  const documentRows: DocumentRow[] = [
    {
      key: 'opening',
      label: formatMessage(
        { id: 'savingsFund.statement.document.opening' },
        { date: moment(from).format('DD.MM.YYYY') },
      ),
      balanceUnits: openingUnits,
      balanceValue: summary.startValue,
    },
    ...withRunningBalance(periodTransactions, openingUnits).map(
      ({ transaction, balanceUnits }) => ({
        key: transaction.id ?? transaction.time,
        label: formatDayInTallinn(transaction.time),
        type: typeLabel(transaction),
        units: signedUnits(transaction),
        nav: transaction.nav,
        amount: transaction.amount,
        balanceUnits,
        balanceValue: balanceUnits * transaction.nav,
      }),
    ),
    {
      key: 'totalContributions',
      label: formatMessage({ id: 'savingsFund.statement.document.totalContributions' }),
      balanceValue: contributionsTotal,
    },
    {
      key: 'totalWithdrawals',
      label: formatMessage({ id: 'savingsFund.statement.document.totalWithdrawals' }),
      balanceValue: withdrawalsTotal,
    },
    {
      key: 'closing',
      label: formatMessage(
        { id: 'savingsFund.statement.document.closing' },
        { date: moment(to).format('DD.MM.YYYY') },
      ),
      balanceUnits: closingUnits,
      balanceValue: summary.endValue,
      isClosing: true,
    },
    ...(valueChange === null
      ? []
      : [
          {
            key: 'valueChange',
            label: formatMessage({ id: 'savingsFund.statement.document.valueChange' }),
            balanceValue: valueChange,
          },
        ]),
  ];

  const downloadCsv = () => {
    const header = documentColumnHeadings.map((id) => formatMessage({ id }));
    const csv = [header, ...documentRows.map(csvCells)]
      .map((cells) => cells.join(ESTONIAN_EXCEL_COLUMN_SEPARATOR))
      .join('\r\n');
    download(
      new Blob([UTF8_BYTE_ORDER_MARK, csv], { type: 'text/csv;charset=utf-8' }),
      `tuleva-kogumisfondi-valjavote-${from}-${to}.csv`,
    );
  };

  const dataSource = [...periodTransactions].reverse().map((transaction) => ({
    date: <span className="text-nowrap">{formatDayInTallinn(transaction.time)}</span>,
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
              onClick={printStatement}
              disabled={!exportable}
            >
              <FormattedMessage id="savingsFund.statement.export.pdf" />
            </button>
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={downloadCsv}
              disabled={!exportable}
            >
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

      <PrintOnlyDocument>
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
            <tr>
              <th scope="row">
                <FormattedMessage id="savingsFund.statement.document.fund" />
              </th>
              <td>
                {savingsFund.name} ({savingsFund.isin})
              </td>
            </tr>
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

        <DocumentTable rows={documentRows} />

        <p className="text-body-secondary small">
          <FormattedMessage
            id="savingsFund.statement.document.generated"
            values={{ date: moment().format('DD.MM.YYYY') }}
          />
        </p>
      </PrintOnlyDocument>
    </>
  );
};

const stopPrintingStatement = () => {
  document.body.classList.remove(styles.printingStatement);
  window.removeEventListener('afterprint', stopPrintingStatement);
};

const printStatement = () => {
  document.body.classList.add(styles.printingStatement);
  window.addEventListener('afterprint', stopPrintingStatement);
  window.print();
};

const PrintOnlyDocument: React.FunctionComponent<{ children: React.ReactNode }> = ({
  children,
}) => {
  useEffect(() => stopPrintingStatement, []);

  return createPortal(<div className={styles.printOnly}>{children}</div>, document.body);
};

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
