import React, { useState } from 'react';
import moment from 'moment';
import { FormattedMessage } from 'react-intl';
import { Euro } from '../../common/Euro';
import { PillButton } from '../../common/PillButton';
import { TranslationKey } from '../../translations';
import { Portfolio, PortfolioGroup, PortfolioGroupSummary } from '../../common/apiModels';
import { PeriodSelector } from './PeriodSelector';
import { StatementSection } from './StatementSection';
import { buildChartSeries } from './chartSeries';
import { ChartPoint, ValueChart } from './ValueChart';

// Bottom of the stack first: the pillars someone has held longest sit underneath, and
// the savings fund rides on top of them.
const GROUPS: { id: PortfolioGroup; label: TranslationKey; color: string }[] = [
  {
    id: 'SECOND_PILLAR',
    label: 'savingsFund.statement.show.secondPillar',
    color: '#002f63',
  },
  {
    id: 'THIRD_PILLAR',
    label: 'savingsFund.statement.show.thirdPillar',
    color: '#00aeea',
  },
  {
    id: 'SAVINGS_FUND',
    label: 'savingsFund.statement.show.savingsFund',
    color: '#006ce6',
  },
];

// A group with no published price reports null. Summing it as zero would show someone
// their money as 0 €, so an unknown part makes the whole total unknown.
type AmountField = {
  [K in keyof PortfolioGroupSummary]: PortfolioGroupSummary[K] extends number | null ? K : never;
}[keyof PortfolioGroupSummary];

const add = (summaries: PortfolioGroupSummary[], field: AmountField): number | null =>
  summaries.reduce<number | null>((sum, summary) => {
    const value = summary[field];
    return sum === null || value === null ? null : sum + value;
  }, 0);

const Amount: React.FunctionComponent<{ value: number | null }> = ({ value }) =>
  value === null ? (
    <span className="text-body-secondary">
      <FormattedMessage id="savingsFund.statement.money.unknown" />
    </span>
  ) : (
    <Euro amount={value} />
  );

// The register holds money it has not turned into units yet, and a value rebuilt from
// units alone cannot see it. Where the register has spoken for a group, its balance is
// what the account page shows — so it is what this page shows too, and the gain is
// restated around it rather than left describing a closing value nobody is looking at.
const withCurrentValue = (
  summary: PortfolioGroupSummary,
  currentValue: number | undefined,
): PortfolioGroupSummary => {
  if (currentValue === undefined) {
    return summary;
  }
  const { startValue, contributions, withdrawals } = summary;
  return {
    ...summary,
    endValue: currentValue,
    gain: startValue === null ? null : currentValue + withdrawals - startValue - contributions,
  };
};

export const PortfolioView: React.FunctionComponent<{
  portfolio: Portfolio;
  from: string | undefined;
  to: string;
  currentValues?: Partial<Record<PortfolioGroup, number>>;
  onPeriodChange: (from: string | undefined, to: string) => void;
}> = ({ portfolio, from, to, currentValues, onPeriodChange }) => {
  const groups = portfolio.groups.map((summary) =>
    withCurrentValue(summary, currentValues?.[summary.group]),
  );

  const savingsFundSummary = groups.find((summary) => summary.group === 'SAVINGS_FUND');

  const available = GROUPS.filter(({ id }) => groups.some((summary) => summary.group === id));

  // Everything the person holds is shown until they switch a band off, so someone with
  // no savings fund still lands on their own pillars instead of an empty chart.
  const [hidden, setHidden] = useState<PortfolioGroup[]>([]);
  const visible = available.filter(({ id }) => !hidden.includes(id));

  const visibleSummaries = groups.filter((summary) =>
    visible.some(({ id }) => id === summary.group),
  );

  const startValue = add(visibleSummaries, 'startValue');
  const endValue = add(visibleSummaries, 'endValue');
  const contributions = add(visibleSummaries, 'contributions');
  const withdrawals = add(visibleSummaries, 'withdrawals');
  const gain = add(visibleSummaries, 'gain');

  // A rate belongs to one source. Showing a pillar's rate beside a balance that also
  // includes the savings fund would read as the whole portfolio's return.
  const annualReturnRate =
    visibleSummaries.length === 1 ? visibleSummaries[0].annualReturnRate : null;

  const series: ChartPoint[] = buildChartSeries(
    portfolio.series,
    visible.map(({ id }) => id),
  );

  // Prices are published a day or more behind, so the last point drawn is not always the
  // end of the period. The heading names the day the money on it was actually counted:
  // the register's own day when it answered, otherwise the last day with a price.
  const lastPricedDay = series.length > 0 ? series[series.length - 1].date : undefined;
  const askedTheRegister = visible.some(({ id }) => currentValues?.[id] !== undefined);
  const valuedAt = askedTheRegister ? to : lastPricedDay ?? to;
  const chartStopsEarlier = lastPricedDay !== undefined && lastPricedDay < valuedAt;

  const toggle = (id: PortfolioGroup) =>
    setHidden((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );

  return (
    <>
      <div className="card p-4 mb-3">
        <PeriodSelector
          from={from}
          to={to}
          allTimeStartDate={portfolio.series[0]?.date ?? portfolio.from}
          onPeriodChange={onPeriodChange}
        />

        {available.length > 1 && (
          <div className="d-flex flex-column flex-sm-row flex-wrap align-items-start align-items-sm-center gap-2 mt-3 pt-3 border-top">
            <span className="text-body-secondary me-1">
              <FormattedMessage id="savingsFund.statement.show" />
            </span>
            {/* The last band still showing cannot be switched off: an empty selection would
                sum to nothing and present the person's money as 0 €. */}
            <div className="d-flex flex-wrap gap-2">
              {available.map(({ id, label }) => (
                <PillButton
                  key={id}
                  selected={!hidden.includes(id)}
                  disabled={visible.length === 1 && !hidden.includes(id)}
                  onClick={() => toggle(id)}
                >
                  <FormattedMessage id={label} />
                </PillButton>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card p-4 mb-3">
        <h2 className="h6 text-body-secondary mb-2">
          <FormattedMessage
            id="savingsFund.statement.money.heading"
            values={{ date: moment(valuedAt).format('DD.MM.YYYY') }}
          />
        </h2>
        <div className="display-6 fw-medium text-navy">
          <Amount value={endValue} />
        </div>
        {gain !== null && (
          <div className="mt-1">
            <span className={gain >= 0 ? 'text-success' : 'text-danger'}>
              {gain >= 0 ? '+' : '−'}
              <Euro amount={Math.abs(gain)} />
            </span>{' '}
            <span className="text-body-secondary">
              <FormattedMessage id="savingsFund.statement.money.growth" />
            </span>
          </div>
        )}
        {endValue === null && (
          <div className="alert alert-warning mt-3 mb-0">
            <FormattedMessage id="savingsFund.statement.money.unvaluable" />
          </div>
        )}
        <div className="mt-1 text-body-secondary">
          {annualReturnRate !== null && annualReturnRate !== undefined ? (
            <FormattedMessage
              id="savingsFund.statement.money.annualReturn"
              values={{ rate: `${(annualReturnRate * 100).toFixed(1)}%` }}
            />
          ) : (
            <FormattedMessage id="savingsFund.statement.money.annualReturnUnavailable" />
          )}
        </div>

        <div className="mt-4">
          <ValueChart
            series={series}
            layers={visible.map((group) => ({
              id: group.id,
              color: group.color,
              label: <FormattedMessage id={group.label} />,
            }))}
            totalLabel={<FormattedMessage id="savingsFund.statement.total" />}
          />
          {series.length > 1 && (
            <div className="d-flex justify-content-between text-body-tertiary small mt-1">
              <span>{moment(series[0].date).format('DD.MM.YYYY')}</span>
              <span>{moment(series[series.length - 1].date).format('DD.MM.YYYY')}</span>
            </div>
          )}
          {/* Otherwise the chart simply ends lower than the number above it, and nothing
              on the page says why. */}
          {chartStopsEarlier && series.length > 1 && (
            <p className="text-body-tertiary small mt-1 mb-0">
              <FormattedMessage
                id="savingsFund.statement.money.chartEndsAt"
                values={{ date: moment(lastPricedDay).format('DD.MM.YYYY') }}
              />
            </p>
          )}
          {visible.length > 1 && (
            <div className="d-flex flex-wrap gap-3 mt-2 small">
              {visible.map((group) => (
                <span key={group.id} className="d-inline-flex align-items-center gap-1">
                  <span
                    aria-hidden="true"
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '2px',
                      background: group.color,
                      display: 'inline-block',
                    }}
                  />
                  <FormattedMessage id={group.label} />
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="row g-3 mt-2">
          {[
            {
              key: 'startValue',
              label: <FormattedMessage id="savingsFund.statement.money.startValue" />,
              value: <Amount value={startValue} />,
            },
            {
              key: 'contributions',
              label: <FormattedMessage id="savingsFund.statement.money.contributions" />,
              value: <Amount value={contributions} />,
            },
            {
              key: 'withdrawals',
              label: <FormattedMessage id="savingsFund.statement.money.withdrawals" />,
              value: <Amount value={withdrawals} />,
            },
            {
              key: 'endValue',
              label: <FormattedMessage id="savingsFund.statement.money.endValue" />,
              value: <Amount value={endValue} />,
            },
          ].map((tile) => (
            <div className="col-6 col-md-3" key={tile.key}>
              <div className="border rounded p-3 h-100">
                <div className="small text-body-secondary mb-1">{tile.label}</div>
                <div className="fw-medium text-navy">{tile.value}</div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-body-secondary small mt-3 mb-0">
          <FormattedMessage id="savingsFund.statement.money.explainer" />
        </p>
      </div>

      {/* An accountant needs the period's savings fund transactions and a statement they
          can file, not just a chart. Shown to whoever holds savings fund units — a
          company, a child, or the person themselves. */}
      {savingsFundSummary && (
        <StatementSection summary={savingsFundSummary} from={from ?? portfolio.from} to={to} />
      )}
    </>
  );
};
