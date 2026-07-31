import React, { useMemo, useState } from 'react';
import moment from 'moment';
import { FormattedMessage } from 'react-intl';
import { Fund, Transaction } from '../../common/apiModels';
import { Euro } from '../../common/Euro';
import { TranslationKey } from '../../translations';
import { getPeriodSummary, getStackedSeries, NavHistoryByIsin } from './portfolio';
import { useAnnualReturn } from './useAnnualReturn';
import { ValueChart } from './ValueChart';

type Selection = 'savingsFund' | 'secondPillar' | 'thirdPillar';

const SELECTIONS: {
  id: Selection;
  pillar: number | null;
  label: TranslationKey;
  color: string;
  returnKey?: string;
}[] = [
  {
    id: 'savingsFund',
    pillar: null,
    label: 'savingsFund.statement.show.savingsFund',
    color: '#006ce6',
  },
  {
    id: 'secondPillar',
    pillar: 2,
    label: 'savingsFund.statement.show.secondPillar',
    color: '#002f63',
    returnKey: 'SECOND_PILLAR',
  },
  {
    id: 'thirdPillar',
    pillar: 3,
    label: 'savingsFund.statement.show.thirdPillar',
    color: '#00aeea',
    returnKey: 'THIRD_PILLAR',
  },
];

const today = () => moment().format('YYYY-MM-DD');

export const PortfolioView: React.FunctionComponent<{
  transactions: Transaction[];
  funds: Fund[];
  navHistoryByIsin: NavHistoryByIsin;
  from: string;
  to: string;
  onPeriodChange: (from: string, to: string) => void;
}> = ({ transactions, funds, navHistoryByIsin, from, to, onPeriodChange }) => {
  const available = SELECTIONS.filter(({ pillar }) =>
    funds.some(
      (fund) => fund.pillar === pillar && transactions.some((tx) => tx.isin === fund.isin),
    ),
  );

  // Everything the person holds is shown until they switch a layer off, so someone with
  // no savings fund still lands on their own pillars instead of an empty chart.
  const [hidden, setHidden] = useState<Selection[]>([]);
  const selected = available.map(({ id }) => id).filter((id) => !hidden.includes(id));

  const selectedIsins = funds
    .filter((fund) =>
      selected.some(
        (id) => SELECTIONS.find((selection) => selection.id === id)?.pillar === fund.pillar,
      ),
    )
    .map((fund) => fund.isin);

  const summary = useMemo(
    () => getPeriodSummary(transactions, navHistoryByIsin, selectedIsins, from, to),
    [transactions, navHistoryByIsin, selectedIsins.join(), from, to],
  );

  const activeLayers = SELECTIONS.filter((selection) => selected.includes(selection.id)).map(
    (selection) => ({
      ...selection,
      isins: funds.filter((fund) => fund.pillar === selection.pillar).map((fund) => fund.isin),
    }),
  );

  const stacked = useMemo(
    () => getStackedSeries(transactions, navHistoryByIsin, activeLayers, from, to),
    [transactions, navHistoryByIsin, selected.join(), funds, from, to],
  );

  // A rate belongs to one source. Showing a pillar's rate beside a balance that also
  // includes the savings fund would read as the whole portfolio's return.
  const onlyVisible =
    selected.length === 1 ? SELECTIONS.find(({ id }) => id === selected[0]) : null;
  const returnKeys = onlyVisible?.returnKey ? [onlyVisible.returnKey] : [];
  const { personalReturn } = useAnnualReturn(returnKeys, from, to);

  const toggle = (id: Selection) =>
    setHidden((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );

  const earliestTransaction = transactions
    .filter((transaction) => selectedIsins.includes(transaction.isin))
    .map((transaction) => moment(transaction.time).format('YYYY-MM-DD'))
    .sort()[0];

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
      from: earliestTransaction ?? moment().startOf('year').format('YYYY-MM-DD'),
      to: today(),
    },
  ];

  return (
    <>
      <div className="card p-4 mb-3">
        <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
          <span className="text-body-secondary me-1">
            <FormattedMessage id="savingsFund.statement.period.label" />
          </span>
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`btn btn-sm rounded-pill ${
                from === preset.from && to === preset.to ? 'btn-primary' : 'btn-outline-secondary'
              }`}
              onClick={() => onPeriodChange(preset.from, preset.to)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="d-flex flex-wrap gap-2 align-items-center">
          <input
            type="date"
            aria-label="from"
            className="form-control form-control-sm w-auto"
            value={from}
            max={to}
            onChange={(event) => onPeriodChange(event.target.value, to)}
          />
          <span className="text-body-secondary">–</span>
          <input
            type="date"
            aria-label="to"
            className="form-control form-control-sm w-auto"
            value={to}
            min={from}
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
              <button
                key={id}
                type="button"
                aria-pressed={selected.includes(id)}
                className={`btn btn-sm rounded-pill ${
                  selected.includes(id) ? 'btn-primary' : 'btn-outline-secondary'
                }`}
                onClick={() => toggle(id)}
              >
                <FormattedMessage id={label} />
              </button>
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
          <Euro amount={summary.endValue} />
        </div>
        <div className="mt-1">
          <span className={summary.gain >= 0 ? 'text-success' : 'text-danger'}>
            {summary.gain >= 0 ? '+' : '−'}
            <Euro amount={Math.abs(summary.gain)} />
          </span>{' '}
          <span className="text-body-secondary">
            <FormattedMessage id="savingsFund.statement.money.growth" />
          </span>
        </div>
        <div className="mt-1 text-body-secondary">
          {personalReturn ? (
            <FormattedMessage
              id="savingsFund.statement.money.annualReturn"
              values={{ rate: `${(personalReturn.rate * 100).toFixed(1)}%` }}
            />
          ) : (
            <FormattedMessage id="savingsFund.statement.money.annualReturnUnavailable" />
          )}
        </div>

        <div className="mt-4">
          <ValueChart
            series={stacked}
            layers={activeLayers.map((layer) => ({
              id: layer.id,
              color: layer.color,
              label: <FormattedMessage id={layer.label} />,
            }))}
            totalLabel={<FormattedMessage id="savingsFund.statement.total" />}
          />
          {stacked.length > 1 && (
            <div className="d-flex justify-content-between text-body-tertiary small mt-1">
              <span>{moment(stacked[0].date).format('DD.MM.YYYY')}</span>
              <span>{moment(stacked[stacked.length - 1].date).format('DD.MM.YYYY')}</span>
            </div>
          )}
          {activeLayers.length > 1 && (
            <div className="d-flex flex-wrap gap-3 mt-2 small">
              {activeLayers.map((layer) => (
                <span key={layer.id} className="d-inline-flex align-items-center gap-1">
                  <span
                    aria-hidden="true"
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '2px',
                      background: layer.color,
                      display: 'inline-block',
                    }}
                  />
                  <FormattedMessage id={layer.label} />
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
              value: <Euro amount={summary.startValue} />,
            },
            {
              key: 'contributions',
              label: <FormattedMessage id="savingsFund.statement.money.contributions" />,
              value: <Euro amount={summary.contributions} />,
            },
            {
              key: 'withdrawals',
              label: <FormattedMessage id="savingsFund.statement.money.withdrawals" />,
              value: <Euro amount={summary.withdrawals} />,
            },
            {
              key: 'endValue',
              label: <FormattedMessage id="savingsFund.statement.money.endValue" />,
              value: <Euro amount={summary.endValue} />,
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
