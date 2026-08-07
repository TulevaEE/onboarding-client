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

  it('keeps the last visible band switched on', () => {
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

    const secondPillar = screen.getByRole('button', { name: /II\spillar/ });
    const savingsFund = screen.getByRole('button', { name: /Täiendav Kogumisfond/ });

    userEvent.click(secondPillar);

    expect(savingsFund).toBeDisabled();
    expect(secondPillar).toBeEnabled();

    userEvent.click(savingsFund);

    expect(screen.getAllByText(/200[.,]00/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/500[.,]00/)).not.toBeInTheDocument();

    userEvent.click(secondPillar);

    expect(savingsFund).toBeEnabled();
    expect(secondPillar).toBeEnabled();
    expect(screen.getAllByText(/500[.,]00/).length).toBeGreaterThan(0);
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

  it('says so instead of showing zero when a band cannot be valued', () => {
    render(
      portfolio({
        groups: [
          summary('SAVINGS_FUND', {
            startValue: null,
            endValue: null,
            gain: null,
            gainPercentage: null,
          }),
        ],
      }),
    );

    expect(screen.getByText(/cannot show what this is worth/)).toBeInTheDocument();
    expect(screen.getAllByText(/Not known/).length).toBeGreaterThan(0);
  });

  it('does not add an unvaluable band into the total', () => {
    render(
      portfolio({
        groups: [
          summary('SAVINGS_FUND', { endValue: 200, gain: 50 }),
          summary('SECOND_PILLAR', { endValue: null, gain: null }),
        ],
        series: [
          { date: '2025-01-01', values: { SAVINGS_FUND: 100, SECOND_PILLAR: 200 } },
          { date: '2025-12-31', values: { SAVINGS_FUND: 200, SECOND_PILLAR: 300 } },
        ],
      }),
    );

    expect(screen.getByText(/cannot show what this is worth/)).toBeInTheDocument();
    expect(screen.getAllByText(/Not known/).length).toBeGreaterThan(0);
  });

  it('values the total again once the unvaluable band is switched off', () => {
    render(
      portfolio({
        groups: [
          summary('SAVINGS_FUND', { endValue: 200, gain: 50 }),
          summary('SECOND_PILLAR', { endValue: null, gain: null }),
        ],
        series: [
          { date: '2025-01-01', values: { SAVINGS_FUND: 100, SECOND_PILLAR: 200 } },
          { date: '2025-12-31', values: { SAVINGS_FUND: 200, SECOND_PILLAR: 300 } },
        ],
      }),
    );

    userEvent.click(screen.getByRole('button', { name: /II\spillar/ }));

    expect(screen.getAllByText(/200[.,]00/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/cannot show what this is worth/)).not.toBeInTheDocument();
  });

  it('stacks the savings fund on top of the pillars', () => {
    render(
      portfolio({
        groups: [
          summary('SAVINGS_FUND', { endValue: 200 }),
          summary('SECOND_PILLAR', { endValue: 300 }),
          summary('THIRD_PILLAR', { endValue: 400 }),
        ],
        series: [
          {
            date: '2025-01-01',
            values: { SAVINGS_FUND: 100, SECOND_PILLAR: 200, THIRD_PILLAR: 300 },
          },
          {
            date: '2025-12-31',
            values: { SAVINGS_FUND: 200, SECOND_PILLAR: 300, THIRD_PILLAR: 400 },
          },
        ],
      }),
    );

    // Only the band toggles carry aria-pressed, and they render bottom of the stack first.
    const bands = screen
      .getAllByRole('button', { pressed: true })
      .map((button) => button.textContent);

    expect(bands).toEqual(['II\u00a0pillar', 'III\u00a0pillar', 'T\u00e4iendav Kogumisfond']);
  });
});

describe('the period someone types into the date inputs', () => {
  const renderWithPeriodChange = (onPeriodChange: (from?: string, to?: string) => void) =>
    renderWrapped(
      <PortfolioView
        portfolio={portfolio()}
        from="2025-01-01"
        to="2025-12-31"
        onPeriodChange={onPeriodChange}
      />,
    );

  it('passes a start date on to the period', () => {
    const onPeriodChange = jest.fn();
    renderWithPeriodChange(onPeriodChange);

    userEvent.type(screen.getByLabelText('from'), '2025-03-01');

    expect(onPeriodChange).toHaveBeenCalledWith('2025-03-01', '2025-12-31');
  });

  it('reads a cleared start date as all time rather than as an empty date', () => {
    const onPeriodChange = jest.fn();
    renderWithPeriodChange(onPeriodChange);

    userEvent.clear(screen.getByLabelText('from'));

    expect(onPeriodChange).toHaveBeenCalledWith(undefined, '2025-12-31');
  });

  it('keeps the end date someone had while they retype it', () => {
    const onPeriodChange = jest.fn();
    renderWithPeriodChange(onPeriodChange);

    userEvent.clear(screen.getByLabelText('to'));

    expect(onPeriodChange).not.toHaveBeenCalled();
  });
});
