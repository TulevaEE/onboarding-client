import React from 'react';
import { FormattedMessage, IntlShape, useIntl } from 'react-intl';
import { euro } from './amountFormat';
import { Assumption, SummaryNote } from './chartNotes';
import { ChartEvent } from './chartEvents';
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

interface GuideProps {
  events: ChartEvent[];
  startsBeforePension: boolean;
}

export const ChartGuide = ({ events, startsBeforePension }: GuideProps) => {
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
        {startsBeforePension && (
          <li>
            <FormattedMessage id="futureMe.result.chart.guide.beforePension" />
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
