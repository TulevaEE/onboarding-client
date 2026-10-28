import React, { forwardRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { euro } from './amountFormat';
import { ChartRow, ChartSourceId } from './chartData';
import { ChartEvent } from './chartEvents';
import { SOURCE_COLORS, SOURCE_LABELS } from './chartSources';
import { eventTextOf } from './chartText';

interface Props {
  row: ChartRow;
  events: ChartEvent[];
  layers: ChartSourceId[];
  onClose: () => void;
}

const Cover = ({ row }: { row: ChartRow }) => {
  if (row.shortfall > 0) {
    return (
      <span className="result-chart-tip-missing">
        <FormattedMessage
          id="futureMe.result.chart.tip.missing"
          values={{ amount: euro(row.shortfall) }}
        />
      </span>
    );
  }
  return row.surplus > 0 ? (
    <FormattedMessage
      id="futureMe.result.chart.tip.surplus"
      values={{ amount: euro(row.surplus) }}
    />
  ) : (
    <FormattedMessage id="futureMe.result.chart.tip.covered" />
  );
};

export const ResultChartTip = forwardRef<HTMLDivElement, Props>(
  ({ row, events, layers, onClose }, ref) => {
    const intl = useIntl();
    return (
      <div ref={ref} className="result-chart-tip" data-testid="chart-tip" aria-hidden="true">
        <button
          type="button"
          className="result-chart-tip-close"
          tabIndex={-1}
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
        <div className="result-chart-tip-side">
          <span className="text-secondary">
            <FormattedMessage id="futureMe.result.chart.tip.costs" />
          </span>
          <span className="result-chart-tip-big">{euro(row.costs)}</span>
          <Cover row={row} />
        </div>
      </div>
    );
  },
);
