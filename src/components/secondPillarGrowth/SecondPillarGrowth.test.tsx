import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import SecondPillarGrowth from './SecondPillarGrowth';
import { useSecondPillarAssets } from '../common/apiHooks';
import { SecondPillarAssets } from '../common/apiModels';
import translations from '../translations';
import { secondPillarAssetsResponse } from '../../test/backend-responses';

jest.mock('../common/apiHooks', () => ({
  useSecondPillarAssets: jest.fn(),
}));

jest.mock('react-chartjs-2', () => ({
  Chart: ({ data }: { data: { datasets: { label: string; data: number[] }[] } }) => {
    const [sinu, riikJaMuud, tootlus, valjamaksed] = data.datasets;
    return (
      <div data-testid="mock-chart">
        <span data-testid="segment-sinu">{sinu.data[0].toFixed(2)}</span>
        <span data-testid="segment-riikJaMuud">{riikJaMuud.data[0].toFixed(2)}</span>
        <span data-testid="segment-tootlus">{tootlus.data[0].toFixed(2)}</span>
        <span data-testid="segment-valjamaksed">{valjamaksed.data[0].toFixed(2)}</span>
      </div>
    );
  },
}));

const mockUseSecondPillarAssets = useSecondPillarAssets as jest.MockedFunction<
  typeof useSecondPillarAssets
>;

const renderWithProviders = (component: React.ReactElement) =>
  render(
    <MemoryRouter>
      <IntlProvider locale="en" messages={translations.en}>
        {component}
      </IntlProvider>
    </MemoryRouter>,
  );

const buildAssets = (overrides: Partial<SecondPillarAssets> = {}): SecondPillarAssets => ({
  ...secondPillarAssetsResponse,
  ...overrides,
});

const mockAssets = (assets: SecondPillarAssets) =>
  mockUseSecondPillarAssets.mockReturnValue({
    data: assets,
    isLoading: false,
  } as ReturnType<typeof useSecondPillarAssets>);

const readSegments = () => ({
  sinu: parseFloat(screen.getByTestId('segment-sinu').textContent ?? '0'),
  riikJaMuud: parseFloat(screen.getByTestId('segment-riikJaMuud').textContent ?? '0'),
  tootlus: parseFloat(screen.getByTestId('segment-tootlus').textContent ?? '0'),
  valjamaksed: parseFloat(screen.getByTestId('segment-valjamaksed').textContent ?? '0'),
});

describe('SecondPillarGrowth', () => {
  beforeEach(() => {
    mockUseSecondPillarAssets.mockReset();
  });

  it('shows a shimmer while data is loading', () => {
    mockUseSecondPillarAssets.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useSecondPillarAssets>);

    renderWithProviders(<SecondPillarGrowth />);

    expect(screen.queryByTestId('mock-chart')).not.toBeInTheDocument();
  });

  describe('reference test cases (Kaisa personas)', () => {
    it('case 1 — normal, positive growth, no withdrawals', () => {
      mockAssets(
        buildAssets({
          balance: 15698.36,
          employeeWithheldPortion: 5531.39,
          socialTaxPortion: 8782.61,
          additionalParentalBenefit: 0,
          compensation: 0,
          interest: 0,
          insurance: 1229.25,
          corrections: 0,
          inheritance: 0,
          withdrawals: 0,
        }),
      );
      renderWithProviders(<SecondPillarGrowth />);
      const { sinu, riikJaMuud, tootlus, valjamaksed } = readSegments();
      expect(sinu).toBeCloseTo(5531.39, 2);
      expect(riikJaMuud).toBeCloseTo(10011.86, 2);
      expect(tootlus).toBeCloseTo(155.11, 2);
      expect(valjamaksed).toBeCloseTo(0, 2);
      expect(sinu + riikJaMuud + tootlus + valjamaksed).toBeCloseTo(15698.36, 2);
    });

    it('case 2 — negative growth, no withdrawals', () => {
      mockAssets(
        buildAssets({
          balance: 14700.5,
          employeeWithheldPortion: 4903.95,
          socialTaxPortion: 9807.09,
          additionalParentalBenefit: 0,
          compensation: 0,
          interest: 0,
          insurance: 220,
          corrections: 0,
          inheritance: 0,
          withdrawals: 0,
        }),
      );
      renderWithProviders(<SecondPillarGrowth />);
      const { tootlus, valjamaksed } = readSegments();
      expect(tootlus).toBeLessThan(0);
      expect(tootlus).toBeCloseTo(-230.54, 2);
      expect(valjamaksed).toBeCloseTo(0, 2);
    });

    it('case 3 — fully withdrawn, balance 0', () => {
      mockAssets(
        buildAssets({
          balance: 0,
          employeeWithheldPortion: 1696.38,
          socialTaxPortion: 2923.2,
          additionalParentalBenefit: 0,
          compensation: 0,
          interest: 0,
          insurance: 310,
          corrections: 0,
          inheritance: 0,
          withdrawals: 7160.25,
        }),
      );
      renderWithProviders(<SecondPillarGrowth />);
      const { sinu, riikJaMuud, tootlus, valjamaksed } = readSegments();
      expect(valjamaksed).toBeCloseTo(-7160.25, 2);
      expect(tootlus).toBeCloseTo(2230.67, 2);
      expect(sinu + riikJaMuud + tootlus + valjamaksed).toBeCloseTo(0, 2);
    });

    it('case 4 — small residual + negative growth + partial withdrawal', () => {
      mockAssets(
        buildAssets({
          balance: 53,
          employeeWithheldPortion: 1096.38,
          socialTaxPortion: 2323.2,
          additionalParentalBenefit: 0,
          compensation: 0,
          interest: 0,
          insurance: 350,
          corrections: 0,
          inheritance: 0,
          withdrawals: 3500.25,
        }),
      );
      renderWithProviders(<SecondPillarGrowth />);
      const { sinu, riikJaMuud, tootlus, valjamaksed } = readSegments();
      expect(tootlus).toBeLessThan(0);
      expect(valjamaksed).toBeCloseTo(-3500.25, 2);
      expect(sinu + riikJaMuud + tootlus + valjamaksed).toBeCloseTo(53, 2);
    });

    it('case 5 — parental leave only (no employee contribution)', () => {
      mockAssets(
        buildAssets({
          balance: 425.7,
          employeeWithheldPortion: 0,
          socialTaxPortion: 396.5,
          additionalParentalBenefit: 0,
          compensation: 0,
          interest: 0,
          insurance: 0,
          corrections: 0,
          inheritance: 0,
          withdrawals: 0,
        }),
      );
      renderWithProviders(<SecondPillarGrowth />);
      const { sinu, riikJaMuud, tootlus, valjamaksed } = readSegments();
      expect(sinu).toBeCloseTo(0, 2);
      expect(riikJaMuud).toBeCloseTo(396.5, 2);
      expect(tootlus).toBeCloseTo(29.2, 2);
      expect(valjamaksed).toBeCloseTo(0, 2);
    });

    it('case 6 — PIK conversion renders a disclaimer', () => {
      mockAssets(
        buildAssets({
          pikFlag: true,
          balance: 0,
          employeeWithheldPortion: 2115.75,
          socialTaxPortion: 4737.2,
          additionalParentalBenefit: 0,
          compensation: 0,
          interest: 0,
          insurance: 0,
          corrections: 0,
          inheritance: 0,
          withdrawals: 0,
        }),
      );
      renderWithProviders(<SecondPillarGrowth />);
      expect(screen.getByTestId('pik-disclaimer')).toBeInTheDocument();
      expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
    });

    it('does not render the PIK disclaimer for a non-PIK user', () => {
      mockAssets(buildAssets());
      renderWithProviders(<SecondPillarGrowth />);
      expect(screen.queryByTestId('pik-disclaimer')).not.toBeInTheDocument();
    });

    it('case 8 — inherited 2nd pillar assets fold into Riik+muud', () => {
      mockAssets(
        buildAssets({
          balance: 28120.45,
          employeeWithheldPortion: 8042.15,
          socialTaxPortion: 13056.3,
          additionalParentalBenefit: 0,
          compensation: 0,
          interest: 0,
          insurance: 0,
          corrections: 0,
          inheritance: 5000,
          withdrawals: 0,
        }),
      );
      renderWithProviders(<SecondPillarGrowth />);
      const { sinu, riikJaMuud, tootlus, valjamaksed } = readSegments();
      expect(sinu).toBeCloseTo(8042.15, 2);
      expect(riikJaMuud).toBeCloseTo(18056.3, 2);
      expect(tootlus).toBeCloseTo(2022, 2);
      expect(valjamaksed).toBeCloseTo(0, 2);
      expect(sinu + riikJaMuud + tootlus + valjamaksed).toBeCloseTo(28120.45, 2);
    });

    it('case 7 — long-term saver with big positive growth', () => {
      mockAssets(
        buildAssets({
          balance: 46048.71,
          employeeWithheldPortion: 9419.9,
          socialTaxPortion: 16453.08,
          additionalParentalBenefit: 0,
          compensation: 0,
          interest: 0,
          insurance: 0,
          corrections: 0,
          inheritance: 0,
          withdrawals: 0,
        }),
      );
      renderWithProviders(<SecondPillarGrowth />);
      const { sinu, riikJaMuud, tootlus, valjamaksed } = readSegments();
      expect(sinu).toBeCloseTo(9419.9, 2);
      expect(riikJaMuud).toBeCloseTo(16453.08, 2);
      expect(tootlus).toBeCloseTo(20175.73, 2);
      expect(valjamaksed).toBeCloseTo(0, 2);
      expect(sinu + riikJaMuud + tootlus + valjamaksed).toBeCloseTo(46048.71, 2);
    });
  });
});
