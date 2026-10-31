import React from 'react';
import { FormattedMessage, IntlShape, useIntl } from 'react-intl';
import { euro, exactPercent } from './amountFormat';
import { Assumption, CoverSteps, SummaryNote } from './chartNotes';
import { ChartChange, changeKeyOf } from './chartChanges';
import { ChartEvent } from './chartEvents';
import { DEPOSIT_REAL_RETURN, GENERAL_ALLOWANCE, PENSIONER_ALLOWANCE } from './engine/pension';
import { SUMMARY_LABELS } from './chartSources';
import { strong } from './richText';
import { useTouchView } from './useTouchView';

const TAX_FROM = 0.5;

const noteTextOf = (intl: IntlShape, note: SummaryNote) => {
  switch (note.kind) {
    case 'bridge':
      return intl.formatMessage(
        { id: 'futureMe.result.chart.note.bridge' },
        {
          age: note.statePensionAge,
          sources: intl.formatList(
            note.sources.map(({ id, amount }) =>
              intl.formatMessage({ id: SUMMARY_LABELS[id] }, { amount: euro(amount) }),
            ),
          ),
        },
      );
    case 'firstPillarChoice':
      return intl.formatMessage(
        { id: 'futureMe.result.chart.note.firstPillarChoice' },
        {
          paid: note.paid,
          amount: euro(note.paid === 'special' ? note.special : note.oldAge),
          special: euro(note.special),
          oldAge: euro(note.oldAge),
        },
      );
    default:
      return intl.formatMessage(
        {
          id:
            note.kind === 'statePensionTax'
              ? 'futureMe.result.chart.note.statePensionTax'
              : 'futureMe.result.chart.note.specialPensionTax',
        },
        {
          hasTax: note.tax > TAX_FROM ? 'yes' : 'no',
          gross: euro(note.gross),
          tax: euro(note.tax),
          allowance: euro(note.allowance),
        },
      );
  }
};

export const SummaryNotes = ({ notes }: { notes: SummaryNote[] }) => {
  const intl = useIntl();
  return (
    <>
      {notes.map((note) => (
        <li key={note.kind}>{noteTextOf(intl, note)}</li>
      ))}
    </>
  );
};

export const ChartAssumption = ({ assumption }: { assumption: Assumption }) => (
  <p className="result-chart-assumption">
    <FormattedMessage
      id="futureMe.result.chart.assumption"
      values={{ strong, age: assumption.from, amount: euro(assumption.missing) }}
    />
  </p>
);

const COVER_ORDER_ID = 'future-me-chart-cover-order';

const CoverOrder = ({ cover }: { cover: CoverSteps }) => {
  const hasWithdrawals = cover.hasSecondPillarWithdrawal || cover.hasThirdPillarWithdrawal;
  if (!cover.hasDeposit && !hasWithdrawals) {
    return null;
  }
  return (
    <li>
      <span id={COVER_ORDER_ID}>
        <FormattedMessage id="futureMe.result.chart.guide.order.title" />
      </span>
      <ol aria-labelledby={COVER_ORDER_ID}>
        <li>
          <FormattedMessage
            id="futureMe.result.chart.guide.order.pensions"
            values={{ hasFundPension: cover.hasFundPension ? 'yes' : 'no' }}
          />
        </li>
        {cover.hasDeposit && (
          <li>
            <FormattedMessage
              id="futureMe.result.chart.guide.order.deposit"
              values={{ depositLoss: exactPercent(-DEPOSIT_REAL_RETURN) }}
            />
          </li>
        )}
        {cover.hasSecondPillarWithdrawal && (
          <li>
            <FormattedMessage id="futureMe.result.chart.guide.order.secondPillar" />
          </li>
        )}
        {cover.hasThirdPillarWithdrawal && (
          <li>
            <FormattedMessage
              id="futureMe.result.chart.guide.order.thirdPillar"
              values={{ afterSecond: cover.hasSecondPillarWithdrawal ? 'yes' : 'no' }}
            />
          </li>
        )}
      </ol>
      {hasWithdrawals && <FormattedMessage id="futureMe.result.chart.guide.order.notTaken" />}
    </li>
  );
};

const CHANGES_ID = 'future-me-chart-changes';
const MONTHS_IN_YEAR = 12;

const changeTextOf = (intl: IntlShape, change: ChartChange) => {
  const id = `futureMe.result.chart.guide.changes.${change.kind}` as const;
  switch (change.kind) {
    case 'statePensionRise':
      return intl.formatMessage(
        { id },
        {
          age: change.age,
          reason: change.reason,
          amount: euro(change.amount),
          allowance: euro(PENSIONER_ALLOWANCE / MONTHS_IN_YEAR),
          general: euro(GENERAL_ALLOWANCE / MONTHS_IN_YEAR),
        },
      );
    case 'withdrawalStart':
      return intl.formatMessage({ id }, { age: change.age, pillar: change.pillar });
    case 'withdrawalEnd':
      return intl.formatMessage(
        { id },
        { age: change.age, pillar: change.pillar, reason: change.reason },
      );
    case 'fundEnd':
      return intl.formatMessage(
        { id },
        { age: change.age, pillars: change.pillars, years: change.years },
      );
    case 'rescueAllowanceEnd':
      return intl.formatMessage(
        { id },
        { age: change.age, pensionStarts: change.pensionStarts ? 'yes' : 'no' },
      );
    default:
      return intl.formatMessage({ id }, { age: change.age });
  }
};

const ChartChanges = ({ changes }: { changes: ChartChange[] }) => {
  const intl = useIntl();
  if (changes.length === 0) {
    return null;
  }
  return (
    <li>
      <span id={CHANGES_ID}>
        <FormattedMessage id="futureMe.result.chart.guide.changes.title" />
      </span>
      <ul aria-labelledby={CHANGES_ID}>
        {changes.map((change) => (
          <li key={changeKeyOf(change)}>{changeTextOf(intl, change)}</li>
        ))}
      </ul>
    </li>
  );
};

export type BeforePension = 'none' | 'special' | 'fund' | 'both';

interface GuideProps {
  events: ChartEvent[];
  beforePension: BeforePension;
  cover: CoverSteps;
  changes: ChartChange[];
  hasWorkYears: boolean;
  hasRescueAllowance: boolean;
  paysIntoThirdPillar: boolean;
}

export const ChartGuide = ({
  events,
  beforePension,
  cover,
  changes,
  hasWorkYears,
  hasRescueAllowance,
  paysIntoThirdPillar,
}: GuideProps) => {
  const intl = useIntl();
  const isTouchView = useTouchView();
  const horizon = events.find(({ kind }) => kind === 'horizon');
  const fundPeriods = Array.from(
    new Set(events.flatMap(({ kind, years }) => (kind === 'fundEnd' && years ? [years] : []))),
  );
  return (
    <details className="faq-item result-chart-guide">
      <summary>
        <FormattedMessage id="futureMe.result.chart.guide.title" />
      </summary>
      <ul>
        <li>
          <FormattedMessage id="futureMe.result.chart.guide.layers" />
        </li>
        <li>
          <FormattedMessage id="futureMe.result.chart.guide.costs" />
        </li>
        {beforePension !== 'none' && (
          <li>
            <FormattedMessage
              id="futureMe.result.chart.guide.beforePension"
              values={{ shown: beforePension }}
            />
          </li>
        )}
        <li>
          <FormattedMessage
            id={
              isTouchView
                ? 'futureMe.result.chart.guide.eventsTouch'
                : 'futureMe.result.chart.guide.events'
            }
          />
        </li>
        {horizon && (
          <li>
            <FormattedMessage
              id="futureMe.result.chart.guide.horizon"
              values={{ age: horizon.age }}
            />
          </li>
        )}
        {hasWorkYears && (
          <li>
            <FormattedMessage
              id="futureMe.result.chart.guide.workYears"
              values={{ hasAllowance: hasRescueAllowance ? 'yes' : 'no' }}
            />
          </li>
        )}
        {paysIntoThirdPillar && (
          <li>
            <FormattedMessage id="futureMe.result.chart.guide.contribution" />
          </li>
        )}
        <ChartChanges changes={changes} />
        <CoverOrder cover={cover} />
        {fundPeriods.length > 0 && (
          <li>
            <FormattedMessage
              id="futureMe.result.chart.guide.fundPeriod"
              values={{ years: intl.formatList(fundPeriods.map(String)) }}
            />
          </li>
        )}
      </ul>
    </details>
  );
};
