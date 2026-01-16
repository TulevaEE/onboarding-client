import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import SecondPillarTaxWin from './SecondPillarTaxWin';
import { useContributions, useMe } from '../common/apiHooks';
import { Contribution, SecondPillarContribution, User } from '../common/apiModels';
import translations from '../translations';

jest.mock('../common/apiHooks', () => ({
  useContributions: jest.fn(),
  useMe: jest.fn(),
}));

jest.mock('react-chartjs-2', () => ({
  Chart: ({ data }: { data: { datasets: { data: number[] }[] } }) => {
    const socialTax = data.datasets[0].data;
    const netSalaryLoss = data.datasets[1].data;
    const incomeTaxSaved = data.datasets[2].data;

    const leftTotal = socialTax[0] + netSalaryLoss[0] + incomeTaxSaved[0];
    const rightTotal = socialTax[1] + netSalaryLoss[1] + incomeTaxSaved[1];

    return (
      <div data-testid="mock-chart">
        <span data-testid="left-bar-total">{leftTotal.toFixed(0)}</span>
        <span data-testid="right-bar-total">{rightTotal.toFixed(0)}</span>
        <span data-testid="left-income-tax-saved">{incomeTaxSaved[0].toFixed(0)}</span>
        <span data-testid="right-income-tax-saved">{incomeTaxSaved[1].toFixed(0)}</span>
        <span data-testid="left-net-salary-loss">{netSalaryLoss[0].toFixed(0)}</span>
        <span data-testid="right-net-salary-loss">{netSalaryLoss[1].toFixed(0)}</span>
      </div>
    );
  },
}));

const mockUseContributions = useContributions as jest.MockedFunction<typeof useContributions>;
const mockUseMe = useMe as jest.MockedFunction<typeof useMe>;

const renderWithProviders = (component: React.ReactElement) =>
  render(
    <MemoryRouter>
      <IntlProvider locale="en" messages={translations.en}>
        {component}
      </IntlProvider>
    </MemoryRouter>,
  );

const createContributionAtRate = (
  rate: 2 | 4 | 6,
  baseSocialTaxPortion: number,
  contributionDate: string,
): SecondPillarContribution => ({
  pillar: 2,
  socialTaxPortion: baseSocialTaxPortion,
  employeeWithheldPortion: baseSocialTaxPortion * (rate / 4),
  time: contributionDate,
  amount: baseSocialTaxPortion + baseSocialTaxPortion * (rate / 4),
  additionalParentalBenefit: 0,
  interest: 0,
  sender: 'Test Employer',
  currency: 'EUR',
});

const createMockUser = (currentPaymentRate: 2 | 4 | 6): Partial<User> => ({
  id: 1,
  firstName: 'Test',
  lastName: 'User',
  secondPillarPaymentRates: {
    current: currentPaymentRate,
    pending: null,
  },
});

describe('SecondPillarTaxWin', () => {
  const testYear2026 = new Date('2026-01-15');

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(testYear2026);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('THE BUG: User at 2% with January contribution at 6%', () => {
    it('shows different values for 2% and 6% projections when contribution was made at 6%', () => {
      const userAt2Percent = createMockUser(2);
      const socialTaxBase = 100;
      const januaryContributionAt6Percent = createContributionAtRate(
        6,
        socialTaxBase,
        '2026-01-10T10:00:00Z',
      );

      mockUseMe.mockReturnValue({ data: userAt2Percent } as ReturnType<typeof useMe>);
      mockUseContributions.mockReturnValue({
        data: [januaryContributionAt6Percent],
      } as ReturnType<typeof useContributions>);

      renderWithProviders(<SecondPillarTaxWin />);

      const leftBarTotal = screen.getByTestId('left-bar-total');
      const rightBarTotal = screen.getByTestId('right-bar-total');

      expect(leftBarTotal).not.toHaveTextContent(rightBarTotal.textContent ?? '');
    });

    it('scales January 6% contribution correctly to 2% projection', () => {
      const userAt2Percent = createMockUser(2);
      const socialTaxBase = 100;
      const januaryContributionAt6Percent = createContributionAtRate(
        6,
        socialTaxBase,
        '2026-01-10T10:00:00Z',
      );

      mockUseMe.mockReturnValue({ data: userAt2Percent } as ReturnType<typeof useMe>);
      mockUseContributions.mockReturnValue({
        data: [januaryContributionAt6Percent],
      } as ReturnType<typeof useContributions>);

      renderWithProviders(<SecondPillarTaxWin />);

      const leftIncomeTaxSaved = screen.getByTestId('left-income-tax-saved');
      const rightIncomeTaxSaved = screen.getByTestId('right-income-tax-saved');

      const leftValue = parseInt(leftIncomeTaxSaved.textContent || '0', 10);
      const rightValue = parseInt(rightIncomeTaxSaved.textContent || '0', 10);

      expect(rightValue).toBe(leftValue * 3);
    });
  });

  describe('User at 6% with January contribution at 6%', () => {
    it('shows correct scaling for 2% and 6% projections', () => {
      const userAt6Percent = createMockUser(6);
      const socialTaxBase = 100;
      const januaryContributionAt6Percent = createContributionAtRate(
        6,
        socialTaxBase,
        '2026-01-10T10:00:00Z',
      );

      mockUseMe.mockReturnValue({ data: userAt6Percent } as ReturnType<typeof useMe>);
      mockUseContributions.mockReturnValue({
        data: [januaryContributionAt6Percent],
      } as ReturnType<typeof useContributions>);

      renderWithProviders(<SecondPillarTaxWin />);

      const leftIncomeTaxSaved = screen.getByTestId('left-income-tax-saved');
      const rightIncomeTaxSaved = screen.getByTestId('right-income-tax-saved');

      const leftValue = parseInt(leftIncomeTaxSaved.textContent || '0', 10);
      const rightValue = parseInt(rightIncomeTaxSaved.textContent || '0', 10);

      expect(rightValue).toBe(leftValue * 3);
    });
  });

  describe('User at 4% with mixed rate contributions', () => {
    it('scales each contribution based on its actual rate', () => {
      const userAt4Percent = createMockUser(4);
      const socialTaxBase = 100;
      const januaryContributionAt6Percent = createContributionAtRate(
        6,
        socialTaxBase,
        '2026-01-10T10:00:00Z',
      );
      const februaryContributionAt4Percent = createContributionAtRate(
        4,
        socialTaxBase,
        '2026-02-10T10:00:00Z',
      );

      mockUseMe.mockReturnValue({ data: userAt4Percent } as ReturnType<typeof useMe>);
      mockUseContributions.mockReturnValue({
        data: [januaryContributionAt6Percent, februaryContributionAt4Percent],
      } as ReturnType<typeof useContributions>);

      renderWithProviders(<SecondPillarTaxWin />);

      const leftIncomeTaxSaved = screen.getByTestId('left-income-tax-saved');
      const rightIncomeTaxSaved = screen.getByTestId('right-income-tax-saved');

      const leftValue = parseInt(leftIncomeTaxSaved.textContent || '0', 10);
      const rightValue = parseInt(rightIncomeTaxSaved.textContent || '0', 10);

      expect(leftValue).toBeLessThan(rightValue);
    });
  });

  describe('Edge case: socialTaxPortion = 0', () => {
    it('skips contributions with zero socialTaxPortion without crashing', () => {
      const userAt2Percent = createMockUser(2);
      const zeroSocialTaxContribution: SecondPillarContribution = {
        pillar: 2,
        socialTaxPortion: 0,
        employeeWithheldPortion: 0,
        time: '2026-01-10T10:00:00Z',
        amount: 0,
        additionalParentalBenefit: 0,
        interest: 0,
        sender: 'Test Employer',
        currency: 'EUR',
      };
      const normalContribution = createContributionAtRate(2, 100, '2026-02-10T10:00:00Z');

      mockUseMe.mockReturnValue({ data: userAt2Percent } as ReturnType<typeof useMe>);
      mockUseContributions.mockReturnValue({
        data: [zeroSocialTaxContribution, normalContribution],
      } as ReturnType<typeof useContributions>);

      expect(() => renderWithProviders(<SecondPillarTaxWin />)).not.toThrow();

      const leftBarTotal = screen.getByTestId('left-bar-total');
      expect(leftBarTotal).toBeInTheDocument();
    });
  });

  describe('Multiple months, same rate', () => {
    it('calculates correct projections for all contributions at 6%', () => {
      const userAt6Percent = createMockUser(6);
      const socialTaxBase = 100;
      const contributions = [
        createContributionAtRate(6, socialTaxBase, '2026-01-10T10:00:00Z'),
        createContributionAtRate(6, socialTaxBase, '2026-02-10T10:00:00Z'),
        createContributionAtRate(6, socialTaxBase, '2026-03-10T10:00:00Z'),
      ];

      mockUseMe.mockReturnValue({ data: userAt6Percent } as ReturnType<typeof useMe>);
      mockUseContributions.mockReturnValue({
        data: contributions,
      } as ReturnType<typeof useContributions>);

      renderWithProviders(<SecondPillarTaxWin />);

      const leftIncomeTaxSaved = screen.getByTestId('left-income-tax-saved');
      const rightIncomeTaxSaved = screen.getByTestId('right-income-tax-saved');

      const leftValue = parseInt(leftIncomeTaxSaved.textContent || '0', 10);
      const rightValue = parseInt(rightIncomeTaxSaved.textContent || '0', 10);

      expect(rightValue).toBe(leftValue * 3);
    });
  });

  describe('Rate change mid-year', () => {
    it('scales each contribution from its actual rate', () => {
      const userAt2Percent = createMockUser(2);
      const socialTaxBase = 100;
      const contributionsWithRateChange = [
        createContributionAtRate(6, socialTaxBase, '2026-01-10T10:00:00Z'),
        createContributionAtRate(2, socialTaxBase, '2026-02-10T10:00:00Z'),
      ];

      mockUseMe.mockReturnValue({ data: userAt2Percent } as ReturnType<typeof useMe>);
      mockUseContributions.mockReturnValue({
        data: contributionsWithRateChange,
      } as ReturnType<typeof useContributions>);

      renderWithProviders(<SecondPillarTaxWin />);

      const leftIncomeTaxSaved = screen.getByTestId('left-income-tax-saved');
      const rightIncomeTaxSaved = screen.getByTestId('right-income-tax-saved');

      const leftValue = parseInt(leftIncomeTaxSaved.textContent || '0', 10);
      const rightValue = parseInt(rightIncomeTaxSaved.textContent || '0', 10);

      expect(leftValue).toBeLessThan(rightValue);
      expect(rightValue).toBeGreaterThan(leftValue * 2);
    });
  });

  describe('Loading states', () => {
    it('renders shimmer when contributions is undefined', () => {
      mockUseMe.mockReturnValue({ data: createMockUser(2) } as ReturnType<typeof useMe>);
      mockUseContributions.mockReturnValue({ data: undefined } as ReturnType<
        typeof useContributions
      >);

      renderWithProviders(<SecondPillarTaxWin />);

      // eslint-disable-next-line testing-library/no-node-access
      expect(document.querySelector('.shimmerDefault')).toBeInTheDocument();
    });

    it('renders shimmer when user is undefined', () => {
      mockUseMe.mockReturnValue({ data: undefined } as ReturnType<typeof useMe>);
      mockUseContributions.mockReturnValue({
        data: [createContributionAtRate(2, 100, '2026-01-10T10:00:00Z')],
      } as ReturnType<typeof useContributions>);

      renderWithProviders(<SecondPillarTaxWin />);

      // eslint-disable-next-line testing-library/no-node-access
      expect(document.querySelector('.shimmerDefault')).toBeInTheDocument();
    });
  });

  describe('Year filtering', () => {
    it('only includes contributions from current year', () => {
      const userAt2Percent = createMockUser(2);
      const socialTaxBase = 100;
      const currentYearContribution = createContributionAtRate(
        2,
        socialTaxBase,
        '2026-03-10T10:00:00Z',
      );
      const previousYearContribution = createContributionAtRate(6, 200, '2025-12-10T10:00:00Z');

      mockUseMe.mockReturnValue({ data: userAt2Percent } as ReturnType<typeof useMe>);
      mockUseContributions.mockReturnValue({
        data: [currentYearContribution, previousYearContribution],
      } as ReturnType<typeof useContributions>);

      renderWithProviders(<SecondPillarTaxWin />);

      const leftIncomeTaxSaved = screen.getByTestId('left-income-tax-saved');
      const leftValue = parseInt(leftIncomeTaxSaved.textContent || '0', 10);

      expect(leftValue).toBe(11);
    });
  });

  describe('Third pillar contributions', () => {
    it('ignores third pillar contributions in calculations', () => {
      const userAt2Percent = createMockUser(2);
      const socialTaxBase = 100;
      const secondPillarContribution = createContributionAtRate(
        2,
        socialTaxBase,
        '2026-01-10T10:00:00Z',
      );
      const thirdPillarContribution = {
        pillar: 3 as const,
        amount: 500,
        time: '2026-01-15T10:00:00Z',
        sender: 'Self',
        currency: 'EUR' as const,
      };

      mockUseMe.mockReturnValue({ data: userAt2Percent } as ReturnType<typeof useMe>);
      mockUseContributions.mockReturnValue({
        data: [secondPillarContribution, thirdPillarContribution],
      } as ReturnType<typeof useContributions>);

      renderWithProviders(<SecondPillarTaxWin />);

      const leftIncomeTaxSaved = screen.getByTestId('left-income-tax-saved');
      const leftValue = parseInt(leftIncomeTaxSaved.textContent || '0', 10);

      expect(leftValue).toBe(11);
    });
  });

  describe('Empty contributions', () => {
    it('handles empty contributions array', () => {
      mockUseMe.mockReturnValue({ data: createMockUser(2) } as ReturnType<typeof useMe>);
      mockUseContributions.mockReturnValue({
        data: [] as Contribution[],
      } as ReturnType<typeof useContributions>);

      renderWithProviders(<SecondPillarTaxWin />);

      const leftIncomeTaxSaved = screen.getByTestId('left-income-tax-saved');
      expect(leftIncomeTaxSaved).toHaveTextContent('0');
    });
  });

  describe('Varying wage amounts', () => {
    it('correctly scales contributions with different wage bases', () => {
      const userAt6Percent = createMockUser(6);
      const lowWageContribution = createContributionAtRate(6, 60, '2026-01-10T10:00:00Z');
      const highWageContribution = createContributionAtRate(6, 240, '2026-02-10T10:00:00Z');

      mockUseMe.mockReturnValue({ data: userAt6Percent } as ReturnType<typeof useMe>);
      mockUseContributions.mockReturnValue({
        data: [lowWageContribution, highWageContribution],
      } as ReturnType<typeof useContributions>);

      renderWithProviders(<SecondPillarTaxWin />);

      const leftIncomeTaxSaved = screen.getByTestId('left-income-tax-saved');
      const rightIncomeTaxSaved = screen.getByTestId('right-income-tax-saved');

      const leftValue = parseInt(leftIncomeTaxSaved.textContent || '0', 10);
      const rightValue = parseInt(rightIncomeTaxSaved.textContent || '0', 10);

      expect(rightValue).toBe(leftValue * 3);
    });
  });

  describe('Income tax calculation', () => {
    it('applies 22% income tax rate correctly', () => {
      const userAt2Percent = createMockUser(2);
      const socialTaxBase = 100;
      const contribution = createContributionAtRate(2, socialTaxBase, '2026-01-10T10:00:00Z');

      mockUseMe.mockReturnValue({ data: userAt2Percent } as ReturnType<typeof useMe>);
      mockUseContributions.mockReturnValue({
        data: [contribution],
      } as ReturnType<typeof useContributions>);

      renderWithProviders(<SecondPillarTaxWin />);

      const leftIncomeTaxSaved = screen.getByTestId('left-income-tax-saved');
      const leftValue = parseInt(leftIncomeTaxSaved.textContent || '0', 10);

      expect(leftValue).toBe(11);
    });
  });

  describe('Net salary loss calculation', () => {
    it('applies 78% net salary loss rate correctly', () => {
      const userAt2Percent = createMockUser(2);
      const socialTaxBase = 100;
      const contribution = createContributionAtRate(2, socialTaxBase, '2026-01-10T10:00:00Z');

      mockUseMe.mockReturnValue({ data: userAt2Percent } as ReturnType<typeof useMe>);
      mockUseContributions.mockReturnValue({
        data: [contribution],
      } as ReturnType<typeof useContributions>);

      renderWithProviders(<SecondPillarTaxWin />);

      const leftNetSalaryLoss = screen.getByTestId('left-net-salary-loss');
      const leftValue = parseInt(leftNetSalaryLoss.textContent || '0', 10);

      expect(leftValue).toBe(39);
    });
  });

  describe('Chart data for 4% user', () => {
    it('shows 2% vs 4% comparison for 4% user', () => {
      const userAt4Percent = createMockUser(4);
      const socialTaxBase = 100;
      const contribution = createContributionAtRate(4, socialTaxBase, '2026-01-10T10:00:00Z');

      mockUseMe.mockReturnValue({ data: userAt4Percent } as ReturnType<typeof useMe>);
      mockUseContributions.mockReturnValue({
        data: [contribution],
      } as ReturnType<typeof useContributions>);

      renderWithProviders(<SecondPillarTaxWin />);

      const leftIncomeTaxSaved = screen.getByTestId('left-income-tax-saved');
      const rightIncomeTaxSaved = screen.getByTestId('right-income-tax-saved');

      const leftValue = parseInt(leftIncomeTaxSaved.textContent || '0', 10);
      const rightValue = parseInt(rightIncomeTaxSaved.textContent || '0', 10);

      expect(rightValue).toBe(leftValue * 2);
    });
  });
});
