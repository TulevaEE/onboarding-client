import { shallow, ShallowWrapper } from 'enzyme';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { BrowserRouter } from 'react-router-dom';
import translations from '../../../translations';
import { Props, SecondPillarStatusBox } from './SecondPillarStatusBox';
import {
  activeSecondPillar,
  activeSecondPillarBondFund,
  completeSecondPillarConversion,
  highFeeSecondPillar,
  lowFeesNoTulevaConversion,
  tulevaSecondPillarFund,
} from '../fixtures';

// TODO: Figure out a cleaner way to mock the hooks
jest.mock('../../../common/apiHooks', () => ({
  usePendingApplications: () => ({ data: [{ type: 'WITHDRAWAL' }] }),
  useTransactions: () => ({ data: [{ amount: 100 }] }),
  useFunds: () => ({ data: [{ pillar: 2 }] }),
  useMandateDeadlines: () => ({ data: { periodEnding: '2024-07-31T00:59:59.999999999Z' } }),
  useFundPensionStatus: () => ({ fundPensions: [] }),
  useContributions: () => ({
    data: [
      {
        pillar: 2,
        time: new Date().toISOString(),
        employeeWithheldPortion: 100,
      },
    ],
  }),
}));

jest.useFakeTimers();
jest.setSystemTime(new Date('2024-07-22T10:36:00Z'));

/**
 * @deprecated Use AccountPageView.test.tsx
 */
describe('SecondPillarStatusBox', () => {
  let component: ShallowWrapper;
  const props: Props = {
    loading: false,
    conversion: completeSecondPillarConversion.secondPillar,
    sourceFunds: [activeSecondPillar],
    targetFunds: [tulevaSecondPillarFund],
    secondPillarActive: true,
    pendingPaymentRate: 6,
    currentPaymentRate: 6,
    activeFundIsin: 'EE000123',
  };

  beforeEach(() => {
    component = shallow(<SecondPillarStatusBox {...props} />);
  });

  it('renders the success flow', () => {
    expect(component).toMatchSnapshot();
  });

  it('renders the payment rate flow', () => {
    component.setProps({ currentPaymentRate: 2, pendingPaymentRate: 2 });
    expect(component).toMatchSnapshot();
  });

  it('renders the payment rate flow', () => {
    component.setProps({ currentPaymentRate: 6, pendingPaymentRate: 2 });
    expect(component).toMatchSnapshot();
  });

  it('renders no 2nd pillar flow when no second pillar', () => {
    component.setProps({ secondPillarActive: false });
    expect(component).toMatchSnapshot();
  });

  it('renders the withdrawal flow when withdrawal is in progress', () => {
    component.setProps({ conversion: { pendingWithdrawal: true } });
    expect(component).toMatchSnapshot();
  });

  it('renders low fee when fund selection incomplete', () => {
    component.setProps({
      conversion: { selectionPartial: false, selectionComplete: false, weightedAverageFee: 0.0049 },
    });
    expect(component).toMatchSnapshot();
  });

  it('renders high fee flow when fund selection incomplete', () => {
    component.setProps({
      sourceFunds: [highFeeSecondPillar],
      targetFunds: [tulevaSecondPillarFund],
      conversion: { selectionPartial: false, selectionComplete: false, weightedAverageFee: 0.0051 },
    });
    expect(component).toMatchSnapshot();
  });

  it('renders high fee message when in high fee fund and no partial conversion', () => {
    component.setProps({
      sourceFunds: [highFeeSecondPillar],
      targetFunds: [tulevaSecondPillarFund],
      conversion: {
        transfersPartial: false,
        transfersComplete: false,
        selectionPartial: false,
        selectionComplete: false,
        weightedAverageFee: 0.01,
      },
    });
    expect(component).toMatchSnapshot();
  });

  it('renders the transfer flow when fund transfers incomplete', () => {
    component.setProps({
      conversion: {
        transfersPartial: false,
        transfersComplete: false,
        selectionPartial: true,
        selectionComplete: true,
        weightedAverageFee: 0.01,
      },
    });
    expect(component).toMatchSnapshot();
  });

  it('renders the bond fund nudge', () => {
    component.setProps({
      sourceFunds: [activeSecondPillarBondFund],
      activeFundIsin: 'EE3600109443',
    });
    expect(component).toMatchSnapshot();
  });
});

// Test with React Testing Library for deep rendering
describe('SecondPillarStatusBox - Component Integration Tests', () => {
  const renderWithIntl = (component: React.ReactElement) =>
    render(
      <BrowserRouter>
        <IntlProvider
          locale="en"
          messages={translations.en}
          defaultLocale="et"
          onError={(err) => {
            if (err.code === 'MISSING_TRANSLATION') {
              return;
            }
            throw err;
          }}
        >
          {component}
        </IntlProvider>
      </BrowserRouter>,
    );

  describe('InLowFeeFund component', () => {
    it('renders tax win component as separate line item in low fee fund', () => {
      const props: Props = {
        ...completeSecondPillarConversion,
        loading: false,
        conversion: {
          ...completeSecondPillarConversion.secondPillar,
          selectionComplete: false,
          transfersComplete: false,
          weightedAverageFee: 0.0049,
        },
        sourceFunds: [activeSecondPillar],
        targetFunds: [tulevaSecondPillarFund],
        secondPillarActive: true,
        pendingPaymentRate: 6,
        currentPaymentRate: 6,
        activeFundIsin: 'EE000123',
      };

      renderWithIntl(<SecondPillarStatusBox {...props} />);

      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
      expect(screen.getByText(/6%/)).toBeInTheDocument();

      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);

      const euroElements = screen.getAllByText(/€/);
      expect(euroElements.length).toBeGreaterThan(0);
    });

    it('renders both current and future payment rates when they differ', () => {
      const props: Props = {
        loading: false,
        conversion: {
          ...lowFeesNoTulevaConversion.secondPillar,
          transfersPartial: true,
          weightedAverageFee: 0.0049,
        },
        sourceFunds: [activeSecondPillar],
        targetFunds: [tulevaSecondPillarFund],
        secondPillarActive: true,
        pendingPaymentRate: 6,
        currentPaymentRate: 2,
        activeFundIsin: 'EE000123',
      };

      renderWithIntl(<SecondPillarStatusBox {...props} />);

      expect(screen.getByText(/2%/)).toBeInTheDocument();
      expect(screen.getByText(/6%/)).toBeInTheDocument();

      const euroElements = screen.getAllByText(/€/);
      expect(euroElements.length).toBeGreaterThan(0);
    });

    it('does not show action button when loading', () => {
      const props: Props = {
        loading: true,
        conversion: {
          ...lowFeesNoTulevaConversion.secondPillar,
          transfersPartial: true,
          weightedAverageFee: 0.0049,
        },
        sourceFunds: [activeSecondPillar],
        targetFunds: [tulevaSecondPillarFund],
        secondPillarActive: true,
        pendingPaymentRate: 6,
        currentPaymentRate: 6,
        activeFundIsin: 'EE000123',
      };

      renderWithIntl(<SecondPillarStatusBox {...props} />);

      expect(screen.queryByRole('link', { name: /bring to tuleva/i })).not.toBeInTheDocument();
    });
  });

  describe('FullyConvertedToTuleva component', () => {
    it('renders tax win as separate line item when fully converted', () => {
      const props: Props = {
        loading: false,
        conversion: completeSecondPillarConversion.secondPillar,
        sourceFunds: [activeSecondPillar],
        targetFunds: [tulevaSecondPillarFund],
        secondPillarActive: true,
        pendingPaymentRate: 6,
        currentPaymentRate: 6,
        activeFundIsin: 'EE000123',
      };

      renderWithIntl(<SecondPillarStatusBox {...props} />);

      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
      expect(screen.getByText(/6%/)).toBeInTheDocument();

      const euroElements = screen.getAllByText(/€/);
      expect(euroElements.length).toBeGreaterThan(0);
    });

    it('shows payment rate change when current and pending rates differ', () => {
      const props: Props = {
        loading: false,
        conversion: completeSecondPillarConversion.secondPillar,
        sourceFunds: [activeSecondPillar],
        targetFunds: [tulevaSecondPillarFund],
        secondPillarActive: true,
        pendingPaymentRate: 4,
        currentPaymentRate: 6,
        activeFundIsin: 'EE000123',
      };

      renderWithIntl(<SecondPillarStatusBox {...props} />);

      expect(screen.getByText(/6%/)).toBeInTheDocument();
      expect(screen.getByText(/4%/)).toBeInTheDocument();

      const euroElements = screen.getAllByText(/€/);
      expect(euroElements.length).toBeGreaterThan(0);
    });

    it('does not render action buttons when loading', () => {
      const props: Props = {
        loading: true,
        conversion: completeSecondPillarConversion.secondPillar,
        sourceFunds: [activeSecondPillar],
        targetFunds: [tulevaSecondPillarFund],
        secondPillarActive: true,
        pendingPaymentRate: 6,
        currentPaymentRate: 6,
        activeFundIsin: 'EE000123',
      };

      renderWithIntl(<SecondPillarStatusBox {...props} />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });
});
