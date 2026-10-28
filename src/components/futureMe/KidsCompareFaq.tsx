import React, { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import { TranslationKey } from '../translations';
import { euro } from './amountFormat';
import { AVG_OLD_AGE_PENSION } from './engine/pension';
import {
  Family,
  isRescueComparisonShown,
  isSpecialComparisonShown,
  rescueComparisonOf,
  RescueRow,
  specialComparisonOf,
  SupplementState,
} from './kidsCompare';
import { ResultContext } from './resultAnswers';

type CompareContext = Pick<ResultContext, 'you' | 'plan' | 'age65' | 'age66' | 'specialPension'>;

interface Row {
  key: string;
  name: ReactNode;
  isMine: boolean;
  note?: ReactNode;
  work?: ReactNode;
  parts: ReactNode[];
  total: number;
  totalNote?: ReactNode;
  isMost: boolean;
  supplement: ReactNode;
  after: ReactNode;
}

const paragraph = { p: (chunks: ReactNode) => <p>{chunks}</p> };

const message = (id: string, values: Record<string, ReactNode> = {}) => (
  <FormattedMessage id={id as TranslationKey} values={values} />
);

const Supplement = ({
  state,
  from,
  monthly,
}: {
  state: SupplementState;
  from: number;
  monthly: number;
}) => message('futureMe.age65.faq.compare.supplement', { state, from, monthly: euro(monthly) });

const agesText = (from: number, to: number): string =>
  from === to ? String(from) : `${from}–\u2060${to}`;

const WorkUntil = ({ age, moreYears }: { age: number; moreYears: number }) => (
  <>
    {message('futureMe.age65.faq.compare.work', { age })}
    {moreYears > 0 && (
      <small className="d-block">
        {message('futureMe.age65.faq.compare.moreSalary', { years: moreYears })}
      </small>
    )}
  </>
);

const averageNote = { average: euro(AVG_OLD_AGE_PENSION) };

const familyRow = (family: Family, ownPart: ReactNode, name: string, rest: Partial<Row>): Row => ({
  key: 'family',
  name: message(name),
  isMine: false,
  note: message('futureMe.age65.faq.compare.familyNote'),
  parts: [
    message('futureMe.age65.faq.compare.familyYou', { part: ownPart }),
    message('futureMe.age65.faq.compare.familyPartner', {
      years: family.kidsYears,
      monthly: euro(family.partnerMonthly),
    }),
  ],
  total: family.total,
  totalNote: message('futureMe.age65.faq.compare.familySum', {
    own: euro(family.total - family.partnerTotal),
    partner: euro(family.partnerTotal),
  }),
  isMost: false,
  supplement: null,
  after: null,
  ...rest,
});

const TABLE_TITLE_ID = 'future-me-kids-compare-title';

const CompareTable = ({
  rows,
  pensionAge,
  afterColumn,
}: {
  rows: Row[];
  pensionAge: number;
  afterColumn: string;
}) => {
  const hasWork = rows.some(({ work }) => work);
  const columns = [
    'variant',
    ...(hasWork ? ['work'] : []),
    'until',
    'total',
    'supplement',
    afterColumn,
  ];
  return (
    <>
      <h4 className="h6 mb-2" id={TABLE_TITLE_ID}>
        {message('futureMe.age65.faq.compare.tableTitle')}
      </h4>
      <div
        className="table-responsive"
        role="region"
        aria-labelledby={TABLE_TITLE_ID}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrolling region must take keyboard focus (WCAG 2.1.1)
        tabIndex={0}
      >
        <table
          className="table table-sm align-top mb-2 kids-compare-table"
          aria-labelledby={TABLE_TITLE_ID}
        >
          <thead>
            <tr>
              {columns.map((column) => (
                <th scope="col" key={column}>
                  {message(`futureMe.age65.faq.compare.col.${column}`, { pensionAge })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className={row.isMine ? 'table-active' : undefined}>
                <th scope="row">
                  {row.name}
                  {row.isMine && (
                    <small className="d-block fw-normal">
                      <span aria-hidden="true">✓ </span>
                      {message('futureMe.age65.faq.compare.yourChoice')}
                    </small>
                  )}
                  {row.note && <small className="d-block fw-normal">{row.note}</small>}
                </th>
                {hasWork && <td>{row.work}</td>}
                <td>
                  {row.parts.map((part, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <span className="d-block" key={index}>
                      {part}
                    </span>
                  ))}
                </td>
                <td>
                  {euro(row.total)}
                  {row.totalNote && <small className="d-block">{row.totalNote}</small>}
                  {row.isMost && (
                    <span className="badge rounded-pill text-bg-success ms-1">
                      {message('futureMe.age65.faq.compare.most')}
                    </span>
                  )}
                </td>
                <td>{row.supplement}</td>
                <td>{row.after}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

const CompareFaq = ({ question, children }: { question: string; children: ReactNode }) => (
  <details className="faq-item">
    <summary>{message(question)}</summary>
    <div className="faq-body">{children}</div>
  </details>
);

const rescuePartsOf = ({ toetus, pension }: RescueRow): ReactNode[] => [
  ...(toetus
    ? [
        message('futureMe.age65.faq.compare.toetusPart', {
          ages: agesText(toetus.from, toetus.to),
          monthly: euro(toetus.monthly),
        }),
      ]
    : []),
  ...(pension
    ? [
        message('futureMe.age65.faq.compare.pensionPart', {
          ages: agesText(pension.from, pension.to),
          monthly: euro(pension.monthly),
        }),
      ]
    : []),
];

export const RescueCompareFaq = ({ context }: { context: CompareContext }) => {
  if (!isRescueComparisonShown(context)) {
    return null;
  }
  const { pensionAge, kidsYears, rows, family, supplement, current } = rescueComparisonOf(context);
  const roundedTotals = rows.map(({ total }) => Math.round(total));
  const most = Math.max(...roundedTotals);
  const isMostSetApart = roundedTotals.some((total) => total < most);
  const firstToLeave = Math.min(...rows.map(({ workUntil }) => workUntil));
  const tableRows: Row[] = rows.map((row) => ({
    key: row.basis,
    name: message(`futureMe.you.rescueBasis.${row.basis}.title`),
    isMine: row.basis === current,
    work: <WorkUntil age={row.workUntil} moreYears={row.workUntil - firstToLeave} />,
    parts: rescuePartsOf(row),
    total: row.total,
    isMost: isMostSetApart && Math.round(row.total) === most,
    supplement: (
      <Supplement
        state={supplement.state}
        from={row.pension?.from ?? pensionAge}
        monthly={supplement.monthly}
      />
    ),
    after: message('futureMe.age65.faq.compare.monthly', { amount: euro(row.atPensionAge) }),
  }));
  const toetus = rows.find(({ basis }) => basis === 'toetus');
  const withFamily =
    family && toetus
      ? [
          ...tableRows,
          familyRow(family, rescuePartsOf(toetus)[0], 'futureMe.age65.faq.rescueCompare.family', {
            work: <WorkUntil age={toetus.workUntil} moreYears={0} />,
            supplement: tableRows.find(({ key }) => key === 'toetus')?.supplement,
            after: message('futureMe.age65.faq.compare.familyAfter', {
              amount: euro(toetus.atPensionAge),
            }),
          }),
        ]
      : tableRows;
  return (
    <CompareFaq question="futureMe.age65.faq.rescueCompare.q">
      {message('futureMe.age65.faq.rescueCompare.intro', {
        ...paragraph,
        kidsYears,
        pensionAge,
        aloneAges: agesText(pensionAge - kidsYears, pensionAge - 1),
      })}
      <CompareTable rows={withFamily} pensionAge={pensionAge} afterColumn="after" />
      <p className="small text-secondary mb-0">
        {message('futureMe.age65.faq.rescueCompare.note', averageNote)}
      </p>
    </CompareFaq>
  );
};

export const SpecialCompareFaq = ({ context }: { context: CompareContext }) => {
  if (!isSpecialComparisonShown(context)) {
    return null;
  }
  const { pensionAge, kidsYears, special, oldAge, family, supplement, current, isSpecialHigher } =
    specialComparisonOf(context);
  const most = Math.max(special.total, oldAge.total);
  const part = (kind: 'special' | 'oldAge', option: typeof special) =>
    message(`futureMe.age65.faq.specialCompare.${kind}Part`, {
      ages: agesText(option.from, pensionAge - 1),
      monthly: euro(option.monthly),
    });
  const atPensionAge = (option: typeof special) =>
    message('futureMe.age65.faq.compare.monthly', { amount: euro(option.atPensionAge) });
  const rows: Row[] = [
    {
      key: 'special',
      name: message('futureMe.age65.faq.specialCompare.special'),
      isMine: current === 'special',
      parts: [part('special', special)],
      total: special.total,
      isMost: special.total === most,
      supplement: message('futureMe.age65.faq.specialCompare.specialSupplement'),
      after: (
        <>
          {atPensionAge(special)}
          {special.isOldAgeAtPensionAge && (
            <small className="d-block">
              {message('futureMe.age65.faq.specialCompare.oldAgeAtPensionAge')}
            </small>
          )}
        </>
      ),
    },
    {
      key: 'oldAge',
      name: message('futureMe.age65.faq.specialCompare.oldAge'),
      isMine: current === 'oldAge',
      parts: [part('oldAge', oldAge)],
      total: oldAge.total,
      isMost: oldAge.total === most,
      supplement: (
        <Supplement state={supplement.state} from={oldAge.from} monthly={supplement.monthly} />
      ),
      after: atPensionAge(oldAge),
    },
    familyRow(family, part('special', special), 'futureMe.age65.faq.specialCompare.family', {
      supplement: message('futureMe.age65.faq.specialCompare.familySupplement'),
      after: atPensionAge(special),
    }),
  ];
  return (
    <CompareFaq question="futureMe.age65.faq.specialCompare.q">
      {message('futureMe.age65.faq.specialCompare.intro', {
        ...paragraph,
        kidsYears,
        isSpecialHigher: isSpecialHigher ? 'yes' : 'no',
      })}
      <CompareTable rows={rows} pensionAge={pensionAge} afterColumn="yourAfter" />
      <p className="small text-secondary mb-0">
        {message('futureMe.age65.faq.specialCompare.note', averageNote)}
      </p>
    </CompareFaq>
  );
};
