import React, { forwardRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { euro } from './amountFormat';
import { ChartRow, ChartSourceId } from './chartData';
import { ChartEvent } from './chartEvents';
import { SOURCE_COLORS, SOURCE_LABELS } from './chartSources';
import { Cover as CoverState } from './chartPoints';
import { eventTextOf, withoutLayersTextOf } from './chartText';

interface Props {
  row: ChartRow;
  events: ChartEvent[];
  layers: ChartSourceId[];
  cover: CoverState;
  placement?: 'floating' | 'below';
  onClose: () => void;
}

const Cover = ({ cover }: { cover: CoverState }) => {
  const intl = useIntl();
  const state = (() => {
    if (cover.shortfall > 0) {
      return (
        <span className="result-chart-tip-missing">
          <FormattedMessage
            id="futureMe.result.chart.tip.missing"
            values={{ amount: euro(cover.shortfall) }}
          />
        </span>
      );
    }
    return cover.surplus > 0 ? (
      <FormattedMessage
        id="futureMe.result.chart.tip.surplus"
        values={{ amount: euro(cover.surplus) }}
      />
    ) : (
      <FormattedMessage id="futureMe.result.chart.tip.covered" />
    );
  })();
  return (
    <>
      {state}
      {cover.without.length > 0 && (
        <span className="text-secondary">
          {withoutLayersTextOf(intl, 'futureMe.result.chart.tip.without', cover)}
        </span>
      )}
    </>
  );
};

export const ResultChartTip = forwardRef<HTMLDivElement, Props>(
  ({ row, events, layers, cover, placement = 'floating', onClose }, ref) => {
    const intl = useIntl();
    const isBelow = placement === 'below';
    const regionProps = isBelow
      ? {
          role: 'region',
          'aria-label': intl.formatMessage({ id: 'futureMe.result.chart.tip.region' }),
        }
      : { 'aria-hidden': true };
    return (
      <div
        ref={ref}
        className={`result-chart-tip${isBelow ? ' is-below' : ''}`}
        data-testid="chart-tip"
        {...regionProps}
      >
        <button
          type="button"
          className="result-chart-tip-close"
          tabIndex={isBelow ? 0 : -1}
          aria-label={intl.formatMessage({ id: 'futureMe.result.chart.tip.close' })}
          onClick={onClose}
        >
          ×
        </button>
        <div className="result-chart-tip-age">
          <span className="result-chart-tip-big">
            <FormattedMessage id="futureMe.result.chart.tip.age" values={{ age: row.age }} />
          </span>
          <span className="text-secondary">{row.year}</span>
        </div>
        {events.length > 0 && (
          <ul className="result-chart-tip-events">
            {events.map((event) => (
              <li key={event.kind} className={event.bad ? 'result-chart-tip-bad' : undefined}>
                {eventTextOf(intl, event)}
              </li>
            ))}
          </ul>
        )}
        <div className="result-chart-tip-layers">
          {layers
            .filter((id) => row[id] > 0)
            .map((id) => (
              <div key={id} className="result-chart-tip-layer">
                <span
                  className="result-chart-swatch"
                  style={{ backgroundColor: SOURCE_COLORS[id] }}
                />
                <span className="text-secondary">
                  <FormattedMessage id={SOURCE_LABELS[id]} />
                </span>
                <strong>{euro(row[id])}</strong>
              </div>
            ))}
        </div>
        {!row.isBeforePension && (
          <div className="result-chart-tip-side">
            <span className="text-secondary">
              <FormattedMessage id="futureMe.result.chart.tip.costs" />
            </span>
            <span className="result-chart-tip-big">{euro(row.costs)}</span>
            <Cover cover={cover} />
          </div>
        )}
      </div>
    );
  },
);
