import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWrapped } from '../../../test/utils';
import { Portfolio, PortfolioGroup, PortfolioGroupSummary } from '../../common/apiModels';
import { PortfolioView } from './PortfolioView';

const summary = (
  group: PortfolioGroup,
  overrides: Partial<PortfolioGroupSummary> = {},
): PortfolioGroupSummary => ({
  group,
  startValue: 100,
  endValue: 200,
  contributions: 50,
  withdrawals: 0,
  gain: 50,
  gainPercentage: 33.33,
  annualReturnRate: null,
  ...overrides,
});

const portfolio = (overrides: Partial<Portfolio> = {}): Portfolio => ({
  from: '2025-01-01',
  to: '2025-12-31',
  groups: [summary('SAVINGS_FUND')],
  series: [
    { date: '2025-01-01', values: { SAVINGS_FUND: 100 } },
    { date: '2025-12-31', values: { SAVINGS_FUND: 200 } },
  ],
  ...overrides,
});

const render = (value: Portfolio) =>
  renderWrapped(
    <PortfolioView portfolio={value} from="2025-01-01" to="2025-12-31" onPeriodChange={() => {}} />,
  );

describe('the portfolio the backend valued', () => {
  it('shows the closing value it was given', () => {
    render(portfolio());

    expect(screen.getAllByText(/200[.,]00/).length).toBeGreaterThan(0);
  });

  it('adds up every band the person holds', () => {
    render(
      portfolio({
        groups: [
          summary('SAVINGS_FUND', { endValue: 200, gain: 50 }),
          summary('SECOND_PILLAR', { endValue: 300, gain: 70 }),
        ],
        series: [
          { date: '2025-01-01', values: { SAVINGS_FUND: 100, SECOND_PILLAR: 200 } },
          { date: '2025-12-31', values: { SAVINGS_FUND: 200, SECOND_PILLAR: 300 } },
        ],
      }),
    );

    expect(screen.getAllByText(/500[.,]00/).length).toBeGreaterThan(0);
    expect(screen.getByText(/120[.,]00/)).toBeInTheDocument();
  });

  it('drops a band from the total when it is switched off', () => {
    render(
      portfolio({
        groups: [
          summary('SAVINGS_FUND', { endValue: 200, gain: 50 }),
          summary('SECOND_PILLAR', { endValue: 300, gain: 70 }),
        ],
        series: [
          { date: '2025-01-01', values: { SAVINGS_FUND: 100, SECOND_PILLAR: 200 } },
          { date: '2025-12-31', values: { SAVINGS_FUND: 200, SECOND_PILLAR: 300 } },
        ],
      }),
    );

    userEvent.click(screen.getByRole('button', { name: /II\spillar/ }));

    expect(screen.queryByText(/500[.,]00/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/200[.,]00/).length).toBeGreaterThan(0);
  });

  it('shows the annual return the backend computed for a single band', () => {
    render(
      portfolio({
        groups: [summary('SECOND_PILLAR', { annualReturnRate: 0.0712 })],
        series: [
          { date: '2025-01-01', values: { SECOND_PILLAR: 100 } },
          { date: '2025-12-31', values: { SECOND_PILLAR: 200 } },
        ],
      }),
    );

    expect(screen.getByText(/7\.1%/)).toBeInTheDocument();
  });

  it('withholds a rate that would read as the whole portfolio', () => {
    render(
      portfolio({
        groups: [summary('SAVINGS_FUND'), summary('SECOND_PILLAR', { annualReturnRate: 0.0712 })],
        series: [
          { date: '2025-01-01', values: { SAVINGS_FUND: 100, SECOND_PILLAR: 100 } },
          { date: '2025-12-31', values: { SAVINGS_FUND: 200, SECOND_PILLAR: 200 } },
        ],
      }),
    );

    expect(screen.queryByText(/7\.1%/)).not.toBeInTheDocument();
    expect(screen.getByText(/one selection at a time/)).toBeInTheDocument();
  });

  it('leaves out the days a showing band had no published price', () => {
    render(
      portfolio({
        series: [
          { date: '2025-01-01', values: { SAVINGS_FUND: null } },
          { date: '2025-06-30', values: { SAVINGS_FUND: 150 } },
          { date: '2025-12-31', values: { SAVINGS_FUND: 200 } },
        ],
      }),
    );

    expect(screen.getByText('30.06.2025')).toBeInTheDocument();
    expect(screen.queryByText('01.01.2025')).not.toBeInTheDocument();
  });
});
