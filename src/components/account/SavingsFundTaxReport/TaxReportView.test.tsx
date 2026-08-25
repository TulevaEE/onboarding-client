import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWrapped } from '../../../test/utils';
import { SavingsFundTaxReport } from '../../common/apiModels';
import { TaxReportView } from './TaxReportView';

const report = (overrides: Partial<SavingsFundTaxReport> = {}): SavingsFundTaxReport => ({
  investmentAccount: null,
  year: 2025,
  method: 'WEIGHTED_AVERAGE',
  totalGain: 58.96,
  redemptions: [
    {
      time: '2025-09-10T10:00:00Z',
      units: 40,
      acquisitionCost: 421.04,
      proceeds: 480,
      gain: 58.96,
    },
  ],
  ...overrides,
});

const taxReportView = (
  value: SavingsFundTaxReport,
  { detailsOpen = false, onDetailsToggle = () => {} } = {},
) => (
  <TaxReportView
    report={value}
    taxYears={[2024, 2025]}
    year={value.year}
    method={value.method}
    detailsOpen={detailsOpen}
    isLoading={false}
    onYearChange={() => {}}
    onMethodChange={() => {}}
    onDetailsToggle={onDetailsToggle}
  />
);

const render = (
  value: SavingsFundTaxReport,
  options: { detailsOpen?: boolean; onDetailsToggle?: () => void } = {},
) => renderWrapped(taxReportView(value, options));

describe('the tax report the backend calculated', () => {
  it('shows the gain it was given', () => {
    render(report());

    expect(screen.getByText(/You earned/)).toBeInTheDocument();
    expect(screen.getByText(/58[.,]96/)).toBeInTheDocument();
  });

  it('says it is a loss when the year lost money', () => {
    render(report({ totalGain: -32.5 }));

    expect(screen.getByText(/You had a loss/)).toBeInTheDocument();
    expect(screen.getByText(/32[.,]50/)).toBeInTheDocument();
  });

  it('has nothing to declare when nothing was redeemed', () => {
    render(report({ totalGain: 0, redemptions: [] }));

    expect(screen.getByText(/Nothing to declare/)).toBeInTheDocument();
  });

  it('asks for the details and lists each redemption once they are open', () => {
    const onDetailsToggle = jest.fn();
    const { rerender } = render(report(), { onDetailsToggle });

    userEvent.click(screen.getByRole('button', { name: 'Show details' }));

    expect(onDetailsToggle).toHaveBeenCalled();
    expect(screen.queryByText('10.09.2025')).not.toBeInTheDocument();

    rerender(taxReportView(report(), { detailsOpen: true, onDetailsToggle }));

    expect(screen.getByText('10.09.2025')).toBeInTheDocument();
    expect(screen.getByText(/421[.,]04/)).toBeInTheDocument();
    expect(screen.getByText(/480[.,]00/)).toBeInTheDocument();
  });

  it('tells a screen reader whether the details are open', () => {
    const { rerender } = render(report());

    expect(screen.getByRole('button', { name: 'Show details' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );

    rerender(taxReportView(report(), { detailsOpen: true }));

    expect(screen.getByRole('button', { name: 'Hide details' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('says the savings fund is the only thing covered', () => {
    render(report());

    expect(screen.getByText(/investment account/)).toBeInTheDocument();
  });
});

describe('an investment account someone declared', () => {
  const investmentAccount = (overrides = {}) => ({ totalGain: 60, ...overrides });

  it('keeps its gains apart, and stops asking which account the money came from', () => {
    render(report({ investmentAccount: investmentAccount() }));

    expect(screen.getByText(/Units bought from the investment account/)).toBeInTheDocument();
    expect(screen.getByText(/do not declare this as a gain/)).toBeInTheDocument();
    expect(screen.queryByText(/We do not yet know which account/)).not.toBeInTheDocument();
  });

  it('still asks when nothing was declared', () => {
    render(report());

    expect(screen.getByText(/We do not yet know which account/)).toBeInTheDocument();
  });

  it('says the transactions could not be split when money went elsewhere', () => {
    render(report({ investmentAccount: investmentAccount({ totalGain: null }) }));

    expect(screen.getByRole('alert')).toHaveTextContent(/cannot split these transactions/i);
    expect(screen.queryByText(/Units bought from the investment account/)).not.toBeInTheDocument();
  });
});
