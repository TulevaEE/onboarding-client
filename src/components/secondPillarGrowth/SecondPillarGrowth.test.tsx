import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import SecondPillarGrowth from './SecondPillarGrowth';
import { useSecondPillarAssets } from '../common/apiHooks';
import { SecondPillarAssets } from '../common/apiModels';
import translations from '../translations';

jest.mock('../common/apiHooks', () => ({
  useSecondPillarAssets: jest.fn(),
}));

jest.mock('react-chartjs-2', () => ({
  Chart: ({ data }: { data: { datasets: { label: string; data: number[] }[] } }) => (
    <div data-testid="mock-chart">
      {data.datasets.map((dataset) => (
        <span key={dataset.label} data-testid={`segment-${dataset.label}`}>
          {dataset.data[0].toFixed(2)}
        </span>
      ))}
    </div>
  ),
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

const zeroAssets = (overrides: Partial<SecondPillarAssets> = {}): SecondPillarAssets => ({
  pikFlag: false,
  balance: 0,
  employeeWithheldPortion: 0,
  socialTaxPortion: 0,
  additionalParentalBenefit: 0,
  interest: 0,
  compensation: 0,
  insurance: 0,
  corrections: 0,
  inheritance: 0,
  withdrawals: 0,
  ...overrides,
});

const mockAssets = (assets: SecondPillarAssets) =>
  mockUseSecondPillarAssets.mockReturnValue({
    data: assets,
    isLoading: false,
  } as ReturnType<typeof useSecondPillarAssets>);

const segmentAmount = (label: string): number => {
  const node = screen.queryByTestId(`segment-${label}`);
  if (!node) {
    return 0;
  }
  return parseFloat(node.textContent ?? '0');
};

const accountList = () => within(screen.getByTestId('account-list'));
const subNote = () => screen.getByTestId('sub-note');
const querySubNote = () => screen.queryByTestId('sub-note');

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

  describe('chart segments (Kaisa personas)', () => {
    it('case 1 — normal, positive growth, no withdrawals', () => {
      mockAssets(
        zeroAssets({
          balance: 15698.36,
          employeeWithheldPortion: 5531.39,
          socialTaxPortion: 8782.61,
          insurance: 1229.25,
        }),
      );
      renderWithProviders(<SecondPillarGrowth />);
      expect(segmentAmount('You')).toBeCloseTo(5531.39, 2);
      expect(segmentAmount('State')).toBeCloseTo(10011.86, 2);
      expect(segmentAmount('Return')).toBeCloseTo(155.11, 2);
      expect(segmentAmount('Withdrawn')).toBeCloseTo(0, 2);
      expect(screen.queryByTestId('segment-Inheritance')).not.toBeInTheDocument();
    });

    it('case 2 — negative growth, no withdrawals', () => {
      mockAssets(
        zeroAssets({
          balance: 14700.5,
          employeeWithheldPortion: 4903.95,
          socialTaxPortion: 9807.09,
          insurance: 220,
        }),
      );
      renderWithProviders(<SecondPillarGrowth />);
      expect(segmentAmount('Return')).toBeLessThan(0);
      expect(segmentAmount('Return')).toBeCloseTo(-230.54, 2);
      expect(segmentAmount('Withdrawn')).toBeCloseTo(0, 2);
    });

    it('case 3 — fully withdrawn, balance 0', () => {
      mockAssets(
        zeroAssets({
          balance: 0,
          employeeWithheldPortion: 1696.38,
          socialTaxPortion: 2923.2,
          insurance: 310,
          withdrawals: 7160.25,
        }),
      );
      renderWithProviders(<SecondPillarGrowth />);
      expect(segmentAmount('Withdrawn')).toBeCloseTo(-7160.25, 2);
      expect(segmentAmount('Return')).toBeCloseTo(2230.67, 2);
      const sum =
        segmentAmount('You') +
        segmentAmount('State') +
        segmentAmount('Return') +
        segmentAmount('Withdrawn');
      expect(sum).toBeCloseTo(0, 2);
    });

    it('case 4 — small residual + negative growth + partial withdrawal', () => {
      mockAssets(
        zeroAssets({
          balance: 53,
          employeeWithheldPortion: 1096.38,
          socialTaxPortion: 2323.2,
          insurance: 350,
          withdrawals: 3500.25,
        }),
      );
      renderWithProviders(<SecondPillarGrowth />);
      expect(segmentAmount('Return')).toBeLessThan(0);
      expect(segmentAmount('Withdrawn')).toBeCloseTo(-3500.25, 2);
      const sum =
        segmentAmount('You') +
        segmentAmount('State') +
        segmentAmount('Return') +
        segmentAmount('Withdrawn');
      expect(sum).toBeCloseTo(53, 2);
    });

    it('case 5 — parental leave only (no employee contribution)', () => {
      mockAssets(
        zeroAssets({
          balance: 425.7,
          socialTaxPortion: 396.5,
        }),
      );
      renderWithProviders(<SecondPillarGrowth />);
      expect(segmentAmount('You')).toBeCloseTo(0, 2);
      expect(segmentAmount('State')).toBeCloseTo(396.5, 2);
      expect(segmentAmount('Return')).toBeCloseTo(29.2, 2);
      expect(segmentAmount('Withdrawn')).toBeCloseTo(0, 2);
    });

    it('case 6 — PIK conversion renders a disclaimer', () => {
      mockAssets(
        zeroAssets({
          pikFlag: true,
          balance: 0,
          employeeWithheldPortion: 2115.75,
          socialTaxPortion: 4737.2,
        }),
      );
      renderWithProviders(<SecondPillarGrowth />);
      expect(screen.getByTestId('pik-disclaimer')).toBeInTheDocument();
      expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
    });

    it('does not render the PIK disclaimer for a non-PIK user', () => {
      mockAssets(zeroAssets());
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
        zeroAssets({
          balance: 46048.71,
          employeeWithheldPortion: 9419.9,
          socialTaxPortion: 16453.08,
        }),
      );
      renderWithProviders(<SecondPillarGrowth />);
      expect(segmentAmount('You')).toBeCloseTo(9419.9, 2);
      expect(segmentAmount('State')).toBeCloseTo(16453.08, 2);
      expect(segmentAmount('Return')).toBeCloseTo(20175.73, 2);
      expect(segmentAmount('Withdrawn')).toBeCloseTo(0, 2);
    });
  });

  describe('inheritance segment', () => {
    it('renders an inheritance segment when inheritance > 0', () => {
      mockAssets(
        zeroAssets({
          balance: 18000,
          employeeWithheldPortion: 5000,
          socialTaxPortion: 8000,
          inheritance: 3000,
        }),
      );
      renderWithProviders(<SecondPillarGrowth />);
      expect(screen.getByTestId('segment-Inheritance')).toBeInTheDocument();
      expect(segmentAmount('Inheritance')).toBeCloseTo(3000, 2);
      expect(segmentAmount('Return')).toBeCloseTo(2000, 2);
    });

    it('omits the inheritance segment when inheritance is zero', () => {
      mockAssets(zeroAssets({ inheritance: 0 }));
      renderWithProviders(<SecondPillarGrowth />);
      expect(screen.queryByTestId('segment-Inheritance')).not.toBeInTheDocument();
    });
  });

  describe('sub-notes below chart', () => {
    it('shows the withdrawals sub-note when the user has withdrawn money with positive return', () => {
      mockAssets(
        zeroAssets({
          balance: 0,
          employeeWithheldPortion: 1696.38,
          socialTaxPortion: 2923.2,
          insurance: 310,
          withdrawals: 7160.25,
        }),
      );
      renderWithProviders(<SecondPillarGrowth />);
      expect(subNote()).toHaveTextContent(/you have already received/i);
    });

    it('shows the combined withdrawals-and-negative sub-note when both conditions hold', () => {
      mockAssets(
        zeroAssets({
          balance: 53,
          employeeWithheldPortion: 1096.38,
          socialTaxPortion: 2323.2,
          insurance: 350,
          withdrawals: 3500.25,
        }),
      );
      renderWithProviders(<SecondPillarGrowth />);
      expect(subNote()).toHaveTextContent(/investment return is also currently negative/i);
    });

    it('shows the negative-return sub-note when return is negative and nothing has been withdrawn', () => {
      mockAssets(
        zeroAssets({
          balance: 14700.5,
          employeeWithheldPortion: 4903.95,
          socialTaxPortion: 9807.09,
          insurance: 220,
        }),
      );
      renderWithProviders(<SecondPillarGrowth />);
      expect(subNote()).toHaveTextContent(/your investment return is currently negative/i);
    });

    it('shows the parental-leave sub-note when own contribution is zero and state contribution is positive', () => {
      mockAssets(
        zeroAssets({
          balance: 425.7,
          socialTaxPortion: 396.5,
        }),
      );
      renderWithProviders(<SecondPillarGrowth />);
      expect(subNote()).toHaveTextContent(/haven't made any contributions of your own/i);
    });

    it('shows no sub-note on the happy path', () => {
      mockAssets(
        zeroAssets({
          balance: 15698.36,
          employeeWithheldPortion: 5531.39,
          socialTaxPortion: 8782.61,
          insurance: 1229.25,
        }),
      );
      renderWithProviders(<SecondPillarGrowth />);
      expect(querySubNote()).not.toBeInTheDocument();
    });

    it('shows only the PIK disclaimer (not a sub-note) when pikFlag is true', () => {
      mockAssets(
        zeroAssets({
          pikFlag: true,
          balance: 0,
          employeeWithheldPortion: 2115.75,
          socialTaxPortion: 4737.2,
        }),
      );
      renderWithProviders(<SecondPillarGrowth />);
      expect(screen.getByTestId('pik-disclaimer')).toBeInTheDocument();
      expect(querySubNote()).not.toBeInTheDocument();
    });
  });

  describe('account list', () => {
    it('lists the balance total', () => {
      mockAssets(
        zeroAssets({
          balance: 15698.36,
          employeeWithheldPortion: 5531.39,
          socialTaxPortion: 8782.61,
          insurance: 1229.25,
        }),
      );
      renderWithProviders(<SecondPillarGrowth />);
      expect(accountList().getByText('Balance')).toBeInTheDocument();
      expect(accountList().getByText(/15.?698 €/)).toBeInTheDocument();
    });

    it('lists own contribution, state, return and balance rows', () => {
      mockAssets(
        zeroAssets({
          balance: 15698.36,
          employeeWithheldPortion: 5531.39,
          socialTaxPortion: 8782.61,
          insurance: 1229.25,
        }),
      );
      renderWithProviders(<SecondPillarGrowth />);
      expect(accountList().getByText('Your contribution')).toBeInTheDocument();
      expect(accountList().getByText('State')).toBeInTheDocument();
      expect(accountList().getByText('Return')).toBeInTheDocument();
      expect(accountList().getByText('Balance')).toBeInTheDocument();
    });

    it('includes an inheritance row only when inheritance > 0', () => {
      mockAssets(
        zeroAssets({
          balance: 18000,
          employeeWithheldPortion: 5000,
          socialTaxPortion: 8000,
          inheritance: 3000,
        }),
      );
      renderWithProviders(<SecondPillarGrowth />);
      expect(accountList().getByText('Inheritance')).toBeInTheDocument();
    });

    it('omits the inheritance row when inheritance is zero', () => {
      mockAssets(zeroAssets({ inheritance: 0 }));
      renderWithProviders(<SecondPillarGrowth />);
      expect(accountList().queryByText('Inheritance')).not.toBeInTheDocument();
    });

    it('includes a withdrawals row only when the user has withdrawn money', () => {
      mockAssets(
        zeroAssets({
          balance: 0,
          employeeWithheldPortion: 1696.38,
          socialTaxPortion: 2923.2,
          insurance: 310,
          withdrawals: 7160.25,
        }),
      );
      renderWithProviders(<SecondPillarGrowth />);
      expect(accountList().getByText('Withdrawn')).toBeInTheDocument();
    });

    it('omits the withdrawals row when no money has been withdrawn', () => {
      mockAssets(zeroAssets({ withdrawals: 0 }));
      renderWithProviders(<SecondPillarGrowth />);
      expect(accountList().queryByText('Withdrawn')).not.toBeInTheDocument();
    });
  });

  describe('blog link and methodology', () => {
    it('renders a blog link that opens in a new tab', () => {
      mockAssets(zeroAssets());
      renderWithProviders(<SecondPillarGrowth />);
      const link = screen.getByRole('link', { name: /read more/i });
      expect(link).toHaveAttribute(
        'href',
        'https://tuleva.ee/analuusid/kes-maksab-minu-ii-sambasse/',
      );
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('collapses the methodology section by default', () => {
      mockAssets(zeroAssets());
      renderWithProviders(<SecondPillarGrowth />);
      const details = screen.getByTestId('methodology') as HTMLDetailsElement;
      expect(details.open).toBe(false);
    });

    it('reveals the methodology content on click', () => {
      mockAssets(zeroAssets());
      renderWithProviders(<SecondPillarGrowth />);
      const details = screen.getByTestId('methodology') as HTMLDetailsElement;
      const summary = within(details).getByText(/how is this calculated/i);
      userEvent.click(summary);
      expect(details.open).toBe(true);
    });

    it('mentions that corrections and late-payment interest are folded into the return segment', () => {
      mockAssets(zeroAssets());
      renderWithProviders(<SecondPillarGrowth />);
      expect(
        screen.getByText(/late-payment interest from employers and corrections are folded/i),
      ).toBeInTheDocument();
    });
  });
});
