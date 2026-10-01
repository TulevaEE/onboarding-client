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
import {
  Fund,
  PortfolioGroupSummary,
  Transaction,
  TransactionType,
  User,
} from '../../common/apiModels';
import { isAcquisition, signedUnits } from '../../common/transactions';
import { Units } from '../../common/Units';
import {
  UNITS_FRACTION_DIGITS,
  formatUnits,
  isRoundedUnits,
  navScaleFor,
  roundUnits,
} from '../../common/fundPrecision';
import { TranslationKey } from '../../translations';
import { PII_CLASS } from '../../tracking/piiMarkup';
import styles from './Statement.module.scss';

const TYPE_LABEL: Record<TransactionType, TranslationKey> = {
  CONTRIBUTION_CASH: 'savingsFund.statement.transactions.contribution',
  CONTRIBUTION_CASH_WORKPLACE: 'savingsFund.statement.transactions.contribution',
  SUBTRACTION: 'savingsFund.statement.transactions.redemption',
  TRANSFER_IN: 'savingsFund.statement.transactions.transferIn',
  TRANSFER_OUT: 'savingsFund.statement.transactions.transferOut',
};

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
  nav?: number | null;
  isin?: string;
  amount?: number;
  balanceUnits?: number;
  balanceValue?: number | null;
  isClosing?: boolean;
};

type FigureColumn = {
  field: 'units' | 'nav' | 'amount' | 'balanceUnits' | 'balanceValue';
  heading: TranslationKey;
  printed: (value: number, row: DocumentRow) => React.ReactNode;
  csv: (value: number, row: DocumentRow) => string;
};

const withoutMinusZero = (rounded: string): string =>
  Number(rounded) === 0 ? rounded.replace('-', '') : rounded;

const csvDecimal = (value: number, fractionDigits: number): string =>
  withoutMinusZero(value.toFixed(fractionDigits)).replace('.', ',');

const unitsFigure = {
  printed: formatUnits,
  csv: (units: number) => csvDecimal(roundUnits(units), UNITS_FRACTION_DIGITS),
};

const navFigure = {
  printed: (nav: number, { isin }: DocumentRow) =>
    formatAmountForCount(nav, navScaleFor(isin, nav)),
  csv: (nav: number, { isin }: DocumentRow) => csvDecimal(nav, navScaleFor(isin, nav)),
};

const navText = ({ nav, isin }: Transaction): string =>
  nav === null ? '' : formatAmountForCount(nav, navScaleFor(isin, nav));

const euroFigure = {
  printed: (amount: number) => <Euro amount={amount} />,
  csv: (amount: number) => csvDecimal(amount, 2),
};

const textColumnHeadings: TranslationKey[] = [
  'savingsFund.statement.transactions.date',
  'savingsFund.statement.transactions.type',
];

const figureColumns: FigureColumn[] = [
  { field: 'units', heading: 'savingsFund.statement.transactions.units', ...unitsFigure },
  { field: 'nav', heading: 'savingsFund.statement.transactions.nav', ...navFigure },
  { field: 'amount', heading: 'savingsFund.statement.transactions.amount', ...euroFigure },
  {
    field: 'balanceUnits',
    heading: 'savingsFund.statement.document.balanceUnits',
    ...unitsFigure,
  },
  {
    field: 'balanceValue',
    heading: 'savingsFund.statement.document.balanceValue',
    ...euroFigure,
  },
];

const documentColumnHeadings: TranslationKey[] = [
  ...textColumnHeadings,
  ...figureColumns.map(({ heading }) => heading),
];

const csvFigure = (row: DocumentRow, { field, csv }: FigureColumn): string => {
  const value = row[field];
  return value === null || value === undefined ? '' : csv(value, row);
};

const csvCells = (row: DocumentRow): string[] => [
  row.label,
  row.type ?? '',
  ...figureColumns.map((column) => csvFigure(row, column)),
];

const printedFigure = (row: DocumentRow, { field, printed }: FigureColumn): React.ReactNode => {
  const value = row[field];
  return value === null || value === undefined ? null : printed(value, row);
};

const showsRoundedUnits = (row: DocumentRow): boolean =>
  [row.units, row.balanceUnits].some((units) => units !== undefined && isRoundedUnits(units));

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
          {printedFigure(row, column)}
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
    <tbody className={PII_CLASS}>
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
    .filter(isAcquisition)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const withdrawalsTotal = periodTransactions
    .filter((transaction) => !isAcquisition(transaction))
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const valueChange =
    summary.startValue === null || summary.endValue === null
      ? null
      : summary.endValue - summary.startValue - contributionsTotal - withdrawalsTotal;

  const typeLabel = (transaction: Transaction): string =>
    formatMessage({ id: TYPE_LABEL[transaction.type] });

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
        isin: transaction.isin,
        amount: transaction.amount,
        balanceUnits,
        balanceValue: transaction.nav === null ? null : balanceUnits * transaction.nav,
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
    units: <Units units={signedUnits(transaction)} />,
    nav: navText(transaction),
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
      ...(dataSource.length > 0 && { footer: <Units units={unitsSum} /> }),
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

  const showsRoundedUnitsOnScreen = periodTransactions.some((transaction) =>
    isRoundedUnits(signedUnits(transaction)),
  );

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
          <>
            <Table columns={columns} dataSource={dataSource} />
            {showsRoundedUnitsOnScreen && (
              <p className="text-body-secondary small mt-3 text-pretty">
                <FormattedMessage id="units.roundingNote.screen" />
              </p>
            )}
          </>
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
              <td className={PII_CLASS}>{owner.name}</td>
            </tr>
            <tr>
              <th scope="row">
                <FormattedMessage id={owner.codeLabel} />
              </th>
              <td className={PII_CLASS}>{owner.code}</td>
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

        {documentRows.some(showsRoundedUnits) && (
          <p className="text-body-secondary small">
            <FormattedMessage id="units.roundingNote.printed" />
          </p>
        )}

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
