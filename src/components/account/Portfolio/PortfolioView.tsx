import React, { useState } from 'react';
import moment from 'moment';
import { FormattedMessage } from 'react-intl';
import { Euro } from '../../common/Euro';
import { PillButton } from '../../common/PillButton';
import { TranslationKey } from '../../translations';
import { Portfolio, PortfolioGroup, PortfolioGroupSummary } from '../../common/apiModels';
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

const today = () => moment().format('YYYY-MM-DD');

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

export const PortfolioView: React.FunctionComponent<{
  portfolio: Portfolio;
  from: string | undefined;
  to: string;
  onPeriodChange: (from: string | undefined, to: string) => void;
}> = ({ portfolio, from, to, onPeriodChange }) => {
  const available = GROUPS.filter(({ id }) =>
    portfolio.groups.some((summary) => summary.group === id),
  );

  // Everything the person holds is shown until they switch a band off, so someone with
  // no savings fund still lands on their own pillars instead of an empty chart.
  const [hidden, setHidden] = useState<PortfolioGroup[]>([]);
  const visible = available.filter(({ id }) => !hidden.includes(id));

  const visibleSummaries = portfolio.groups.filter((summary) =>
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

  // Days where a visible band has no published price are left out rather than drawn as
  // zero, which would show up as a cliff on the day its price history begins.
  const series: ChartPoint[] = portfolio.series.flatMap((point) => {
    const values = visible
      .map(({ id }) => point.values[id])
      .filter((value): value is number => value !== null && value !== undefined);

    if (values.length !== visible.length) {
      return [];
    }
    return [{ date: point.date, values, total: values.reduce((sum, value) => sum + value, 0) }];
  });

  const toggle = (id: PortfolioGroup) =>
    setHidden((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );

  const presets = [
    {
      id: 'thisYear',
      label: <FormattedMessage id="savingsFund.statement.period.thisYear" />,
      from: moment().startOf('year').format('YYYY-MM-DD'),
      to: today(),
    },
    {
      id: 'lastYear',
      label: <FormattedMessage id="savingsFund.statement.period.lastYear" />,
      from: moment().subtract(1, 'year').startOf('year').format('YYYY-MM-DD'),
      to: moment().subtract(1, 'year').endOf('year').format('YYYY-MM-DD'),
    },
    {
      id: 'twelveMonths',
      label: <FormattedMessage id="savingsFund.statement.period.twelveMonths" />,
      from: moment().subtract(12, 'month').format('YYYY-MM-DD'),
      to: today(),
    },
    {
      id: 'allTime',
      label: <FormattedMessage id="savingsFund.statement.period.allTime" />,
      from: undefined,
      to: today(),
    },
  ];

  const shownFrom = from ?? portfolio.series[0]?.date ?? portfolio.from;

  return (
    <>
      <div className="card p-4 mb-3">
        <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
          <span className="text-body-secondary me-1">
            <FormattedMessage id="savingsFund.statement.period.label" />
          </span>
          {presets.map((preset) => (
            <PillButton
              key={preset.id}
              selected={from === preset.from && to === preset.to}
              onClick={() => onPeriodChange(preset.from, preset.to)}
            >
              {preset.label}
            </PillButton>
          ))}
        </div>

        <div className="d-flex flex-wrap gap-2 align-items-center">
          <input
            type="date"
            aria-label="from"
            className="form-control form-control-sm w-auto"
            value={shownFrom}
            max={to}
            onChange={(event) => onPeriodChange(event.target.value, to)}
          />
          <span className="text-body-secondary">–</span>
          <input
            type="date"
            aria-label="to"
            className="form-control form-control-sm w-auto"
            value={to}
            min={shownFrom}
            max={today()}
            onChange={(event) => onPeriodChange(from, event.target.value)}
          />
        </div>

        {available.length > 1 && (
          <div className="d-flex flex-wrap gap-2 align-items-center mt-3 pt-3 border-top">
            <span className="text-body-secondary me-1">
              <FormattedMessage id="savingsFund.statement.show" />
            </span>
            {available.map(({ id, label }) => (
              <PillButton
                key={id}
                selected={!hidden.includes(id)}
                pressed={!hidden.includes(id)}
                onClick={() => toggle(id)}
              >
                <FormattedMessage id={label} />
              </PillButton>
            ))}
          </div>
        )}
      </div>

      <div className="card p-4 mb-3">
        <h2 className="h6 text-body-secondary mb-2">
          <FormattedMessage
            id="savingsFund.statement.money.heading"
            values={{ date: moment(to).format('DD.MM.YYYY') }}
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
    </>
  );
};
