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
  Chart: () => <div data-testid="mock-chart" />,
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

const accountList = () => within(screen.getByTestId('account-list'));

const expectRow = (label: string, amount: string) => {
  expect(accountList().getByRole('definition', { name: label })).toHaveTextContent(amount);
};
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
        }),
      );
      renderWithProviders(<SecondPillarGrowth />);
      expectRow('Your contribution', '5 531 €');
      expectRow('Social tax', '8 783 €');
      expectRow('Return', '1 384 €');
      expectRow('Total', '15 698 €');
      expect(accountList().queryByText('Inheritance')).not.toBeInTheDocument();
      expect(accountList().queryByText('Withdrawn')).not.toBeInTheDocument();
    });

    it('case 2 — negative growth, no withdrawals', () => {
      mockAssets(
        zeroAssets({
          balance: 14700.5,
          employeeWithheldPortion: 4903.95,
          socialTaxPortion: 9807.09,
        }),
      );
      renderWithProviders(<SecondPillarGrowth />);
      expectRow('Your contribution', '4 904 €');
      expectRow('Social tax', '9 807 €');
      expectRow('Return', '−11 €');
      expectRow('Total', '14 701 €');
      expect(accountList().queryByText('Withdrawn')).not.toBeInTheDocument();
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
      expectRow('Your contribution', '1 696 €');
      expectRow('Social tax', '2 923 €');
      expectRow('Return', '2 231 €');
      expectRow('Withdrawn', '−6 850 €');
      expectRow('Total', '0 €');
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
      expectRow('Your contribution', '1 096 €');
      expectRow('Social tax', '2 323 €');
      expectRow('Return', '−216 €');
      expectRow('Withdrawn', '−3 150 €');
      expectRow('Total', '53 €');
    });

    it('case 5 — parental leave only (state pays on member behalf)', () => {
      mockAssets(
        zeroAssets({
          balance: 425.7,
          additionalParentalBenefit: 396.5,
        }),
      );
      renderWithProviders(<SecondPillarGrowth />);
      expectRow('Your contribution', '397 €');
      expectRow('Return', '29 €');
      expectRow('Total', '426 €');
      expect(accountList().queryByText('Social tax')).not.toBeInTheDocument();
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

    it('case 8 — inherited 2nd pillar assets render as a separate segment', () => {
      mockAssets(
        zeroAssets({
          balance: 28120.45,
          employeeWithheldPortion: 8042.15,
          socialTaxPortion: 13056.3,
          inheritance: 5000,
        }),
      );
      renderWithProviders(<SecondPillarGrowth />);
      expectRow('Your contribution', '8 042 €');
      expectRow('Social tax', '13 056 €');
      expectRow('Inheritance', '5 000 €');
      expectRow('Return', '2 022 €');
      expectRow('Total', '28 120 €');
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
      expectRow('Your contribution', '9 420 €');
      expectRow('Social tax', '16 453 €');
      expectRow('Return', '20 176 €');
      expectRow('Total', '46 049 €');
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
      expectRow('Inheritance', '3 000 €');
      expectRow('Return', '2 000 €');
    });

    it('omits the inheritance segment when inheritance is zero', () => {
      mockAssets(zeroAssets({ inheritance: 0 }));
      renderWithProviders(<SecondPillarGrowth />);
      expect(accountList().queryByText('Inheritance')).not.toBeInTheDocument();
    });
  });

  describe('sub-notes below chart', () => {
    it('shows the plain withdrawals sub-note when there are withdrawals but no insurance receipts', () => {
      mockAssets(
        zeroAssets({
          balance: 0,
          employeeWithheldPortion: 1696.38,
          socialTaxPortion: 2923.2,
          withdrawals: 7160.25,
        }),
      );
      renderWithProviders(<SecondPillarGrowth />);
      expect(subNote()).toHaveTextContent(/you have withdrawn/i);
    });

    it('shows the pensionileping-unwound sub-note when insurance > 0 and withdrawals > 0', () => {
      mockAssets(
        zeroAssets({
          balance: 12500,
          employeeWithheldPortion: 4000,
          socialTaxPortion: 6500,
          insurance: 2700,
          withdrawals: 3000,
        }),
      );
      renderWithProviders(<SecondPillarGrowth />);
      expect(subNote()).toHaveTextContent(/you have paid/i);
      expect(subNote()).toHaveTextContent(/came back/i);
    });

    it('shows the pensionileping-unwound-and-negative sub-note when insurance > 0 and return is negative', () => {
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
      expect(subNote()).toHaveTextContent(/you have paid/i);
      expect(subNote()).toHaveTextContent(/came back/i);
      expect(subNote()).toHaveTextContent(/at a loss/i);
    });

    it('shows the negative-return sub-note when return is negative and nothing has been withdrawn', () => {
      mockAssets(
        zeroAssets({
          balance: 14700.5,
          employeeWithheldPortion: 4903.95,
          socialTaxPortion: 9807.09,
        }),
      );
      renderWithProviders(<SecondPillarGrowth />);
      expect(subNote()).toHaveTextContent(/your II pillar is at a loss/i);
    });

    it('shows the parental-leave sub-note when own contribution is zero and state contribution is positive', () => {
      mockAssets(
        zeroAssets({
          balance: 425.7,
          socialTaxPortion: 396.5,
        }),
      );
      renderWithProviders(<SecondPillarGrowth />);
      expect(subNote()).toHaveTextContent(/haven't made any contributions to your II pillar yet/i);
    });

    it('shows no sub-note on the happy path', () => {
      mockAssets(
        zeroAssets({
          balance: 15698.36,
          employeeWithheldPortion: 5531.39,
          socialTaxPortion: 8782.61,
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
        }),
      );
      renderWithProviders(<SecondPillarGrowth />);
      expect(accountList().getByText('Total')).toBeInTheDocument();
      expect(accountList().getByText(/15.?698 €/)).toBeInTheDocument();
    });

    it('lists own contribution, state, return and balance rows', () => {
      mockAssets(
        zeroAssets({
          balance: 15698.36,
          employeeWithheldPortion: 5531.39,
          socialTaxPortion: 8782.61,
        }),
      );
      renderWithProviders(<SecondPillarGrowth />);
      expect(accountList().getByText('Your contribution')).toBeInTheDocument();
      expect(accountList().getByText('Social tax')).toBeInTheDocument();
      expect(accountList().getByText('Return')).toBeInTheDocument();
      expect(accountList().getByText('Total')).toBeInTheDocument();
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
      const toggle = screen.getByRole('button', { name: /how is this calculated/i });
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
    });

    it('reveals the methodology content on click', () => {
      mockAssets(zeroAssets());
      renderWithProviders(<SecondPillarGrowth />);
      const toggle = screen.getByRole('button', { name: /how is this calculated/i });
      userEvent.click(toggle);
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
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
