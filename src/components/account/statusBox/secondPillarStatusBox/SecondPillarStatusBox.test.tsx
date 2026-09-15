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

let mockContributionsAreLoaded = true;

// TODO: Figure out a cleaner way to mock the hooks
jest.mock('../../../common/apiHooks', () => ({
  usePendingApplications: () => ({ data: [{ type: 'WITHDRAWAL' }] }),
  useTransactions: () => ({ data: [{ amount: 100 }] }),
  useFunds: () => ({ data: [{ pillar: 2 }] }),
  useMandateDeadlines: () => ({ data: { periodEnding: '2024-07-31T00:59:59.999999999Z' } }),
  useFundPensionStatus: () => ({ fundPensions: [] }),
  useContributions: () => ({
    data: mockContributionsAreLoaded
      ? [
          {
            pillar: 2,
            time: new Date().toISOString(),
            employeeWithheldPortion: 100,
          },
        ]
      : undefined,
  }),
}));

afterEach(() => {
  mockContributionsAreLoaded = true;
});

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
      conversion: { selectionPartial: false, selectionComplete: false, weightedAverageFee: 0.0029 },
    });
    expect(component).toMatchSnapshot();
  });

  it('renders high fee flow when fund selection incomplete', () => {
    component.setProps({
      sourceFunds: [highFeeSecondPillar],
      targetFunds: [tulevaSecondPillarFund],
      conversion: { selectionPartial: false, selectionComplete: false, weightedAverageFee: 0.0031 },
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

// Test with React Testing Library for deep rendering
describe('SecondPillarStatusBox - Component Integration Tests', () => {
  describe('branch order: transfer nudge comes before the payment rate nudge', () => {
    const baseProps: Props = {
      loading: false,
      conversion: completeSecondPillarConversion.secondPillar,
      sourceFunds: [activeSecondPillar],
      targetFunds: [tulevaSecondPillarFund],
      secondPillarActive: true,
      pendingPaymentRate: 2,
      currentPaymentRate: 2,
      activeFundIsin: 'EE000123',
    };

    it('nudges to bring the second pillar over when it is elsewhere in a high-fee fund, even with a low payment rate', () => {
      renderWithIntl(
        <SecondPillarStatusBox
          {...baseProps}
          sourceFunds={[highFeeSecondPillar]}
          conversion={{
            ...completeSecondPillarConversion.secondPillar,
            selectionComplete: false,
            transfersComplete: false,
            weightedAverageFee: 0.01,
          }}
        />,
      );

      expect(screen.getByRole('link', { name: 'Choose Tuleva' })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Increase contribution' })).not.toBeInTheDocument();
    });

    it('counts a fee of exactly 0.3% as high, the way the server decides it', () => {
      renderWithIntl(
        <SecondPillarStatusBox
          {...baseProps}
          sourceFunds={[highFeeSecondPillar]}
          conversion={{
            ...completeSecondPillarConversion.secondPillar,
            selectionComplete: false,
            transfersComplete: false,
            weightedAverageFee: 0.003,
          }}
        />,
      );

      expect(screen.getByText(/in a high cost fund/)).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Increase contribution' })).not.toBeInTheDocument();
    });

    it('nudges the payment rate when the second pillar is elsewhere in a low-fee fund with a low payment rate', () => {
      renderWithIntl(
        <SecondPillarStatusBox
          {...baseProps}
          conversion={{
            ...completeSecondPillarConversion.secondPillar,
            selectionComplete: false,
            transfersComplete: false,
            weightedAverageFee: 0.0029,
          }}
        />,
      );

      expect(screen.getByRole('link', { name: 'Increase contribution' })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Choose Tuleva' })).not.toBeInTheDocument();
    });

    it('nudges to bring the second pillar over when it is elsewhere in a low-fee fund and the payment rate is already raised', () => {
      renderWithIntl(
        <SecondPillarStatusBox
          {...baseProps}
          pendingPaymentRate={6}
          currentPaymentRate={6}
          conversion={{
            ...completeSecondPillarConversion.secondPillar,
            selectionComplete: false,
            transfersComplete: false,
            weightedAverageFee: 0.0029,
          }}
        />,
      );

      expect(screen.getByRole('link', { name: 'Choose Tuleva' })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Increase contribution' })).not.toBeInTheDocument();
    });

    it('nudges the payment rate when the second pillar is already at Tuleva', () => {
      renderWithIntl(<SecondPillarStatusBox {...baseProps} />);

      expect(screen.getByRole('link', { name: 'Increase contribution' })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Choose Tuleva' })).not.toBeInTheDocument();
    });
  });

  describe('InLowFeeFund component', () => {
    it('renders tax win component as separate line item in low fee fund', () => {
      const props: Props = {
        ...completeSecondPillarConversion,
        loading: false,
        conversion: {
          ...completeSecondPillarConversion.secondPillar,
          selectionComplete: false,
          transfersComplete: false,
          weightedAverageFee: 0.0029,
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
          weightedAverageFee: 0.0029,
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
          weightedAverageFee: 0.0029,
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

const byTextContent = (pattern: string | RegExp) => {
  const regex =
    pattern instanceof RegExp
      ? pattern
      : new RegExp(`^${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
  const matching = screen.getAllByText((_, element) => regex.test(element?.textContent ?? ''));
  return matching[matching.length - 1];
};

describe('SecondPillarStatusBox in the payment rate season', () => {
  const paymentRateSeason = {
    deadline: '2026-11-30',
    fulfillmentDate: '2027-01-01',
    mode: 'SEASON' as const,
  };

  const seasonProps = (currentPaymentRate: number, pendingPaymentRate: number): Props => ({
    loading: false,
    conversion: completeSecondPillarConversion.secondPillar,
    sourceFunds: [activeSecondPillar],
    targetFunds: [tulevaSecondPillarFund],
    secondPillarActive: true,
    currentPaymentRate,
    pendingPaymentRate,
    activeFundIsin: 'EE000123',
    paymentRateSeason,
  });

  it('highlights the target rate inside the pill', () => {
    renderWithIntl(<SecondPillarStatusBox {...seasonProps(2, 2)} />);

    expect(byTextContent('up to 6%')).toHaveClass('text-primary');
  });

  it('links the tax win to the tax win page and shows the amount in bold', () => {
    renderWithIntl(<SecondPillarStatusBox {...seasonProps(2, 2)} />);

    expect(screen.getByRole('link', { name: /saved 22\s€ in income tax/ })).toHaveAttribute(
      'href',
      '/2nd-pillar-tax-win',
    );
    expect(byTextContent(/^22\s€$/).tagName).toBe('B');
  });

  it.each([
    [2, 2, 'Now 2% → up to 6%'],
    [4, 4, 'Now 4% → up to 6%'],
  ])('shows the pill and the raise copy for %s%%', (current, pending, pill) => {
    renderWithIntl(<SecondPillarStatusBox {...seasonProps(current, pending)} />);

    expect(byTextContent(pill)).toBeInTheDocument();
    expect(
      byTextContent(/From January\s1 you can contribute up to 6% straight from your gross salary/),
    ).toBeInTheDocument();
    expect(
      byTextContent(
        /This year you saved 22\s€ in income tax, the application deadline is November\s30/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Increase contribution' })).toBeInTheDocument();
  });

  it('congratulates the maximum contributor without an action', () => {
    renderWithIntl(<SecondPillarStatusBox {...seasonProps(6, 6)} />);

    expect(
      byTextContent(/You contribute the maximum to II\spillar, 6% of your gross salary/),
    ).toBeInTheDocument();
    expect(
      byTextContent(
        /This year you saved 22\s€ in income tax, your decision works for you every month/,
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      '/2nd-pillar-tax-win',
    ]);
    expect(screen.queryByText(/→/)).not.toBeInTheDocument();
  });

  it.each([
    [2, 6],
    [4, 6],
  ])('confirms a pending raise from %s%% to 6%% without an action', (current, pending) => {
    renderWithIntl(<SecondPillarStatusBox {...seasonProps(current, pending)} />);

    expect(
      byTextContent(/From January\s1 you will contribute 6% of your gross salary to II\spillar/),
    ).toBeInTheDocument();
    expect(
      byTextContent(
        /This year you saved 22\s€ in income tax, the application is in and there is nothing more to do/,
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      '/2nd-pillar-tax-win',
    ]);
  });

  it('invites a pending 4% raise to go further', () => {
    renderWithIntl(<SecondPillarStatusBox {...seasonProps(2, 4)} />);

    expect(
      byTextContent(/From January\s1 you will contribute 4% of your gross salary to II\spillar/),
    ).toBeInTheDocument();
    expect(
      byTextContent(
        /This year you saved 22\s€ in income tax, until November\s30 you can raise it to 6%/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Increase contribution' })).toBeInTheDocument();
  });

  it.each([
    [4, 2],
    [6, 4],
    [6, 2],
  ])('describes a pending decrease from %s%% to %s%%', (current, pending) => {
    renderWithIntl(<SecondPillarStatusBox {...seasonProps(current, pending)} />);

    expect(
      byTextContent(
        new RegExp(
          `From January\\s1 you will contribute ${pending}% of your gross salary to II\\spillar, now ${current}%`,
        ),
      ),
    ).toBeInTheDocument();
    expect(
      byTextContent(
        /This year you saved 22\s€ in income tax, you can change your choice until November\s30/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Change contribution' })).toBeInTheDocument();
    expect(screen.getByTestId('status-icon-warning')).toBeInTheDocument();
  });

  it('emphasizes the deadline fact in the last days', () => {
    renderWithIntl(
      <SecondPillarStatusBox
        {...seasonProps(2, 2)}
        paymentRateSeason={{ ...paymentRateSeason, mode: 'LAST_DAYS' }}
      />,
    );

    expect(byTextContent(/^the application deadline is November\s30$/).tagName).toBe('B');
  });

  it('shimmers the tax win line instead of guessing while the contributions load', () => {
    mockContributionsAreLoaded = false;

    renderWithIntl(<SecondPillarStatusBox {...seasonProps(2, 2)} />);

    // eslint-disable-next-line testing-library/no-node-access
    expect(document.querySelector('.shimmerDefault')).toBeInTheDocument();
    expect(screen.queryByText(/This year you saved/)).not.toBeInTheDocument();
    expect(screen.queryByText(/The application deadline is/)).not.toBeInTheDocument();
  });

  it('keeps the transfer call to action for a saver whose second pillar is elsewhere', () => {
    renderWithIntl(
      <SecondPillarStatusBox
        {...seasonProps(6, 6)}
        conversion={{
          ...completeSecondPillarConversion.secondPillar,
          selectionComplete: false,
          transfersComplete: false,
          weightedAverageFee: 0.0029,
        }}
      />,
    );

    expect(screen.getByRole('link', { name: 'Choose Tuleva' })).toBeInTheDocument();
    expect(screen.queryByText(/You contribute the maximum to II\spillar/)).not.toBeInTheDocument();
  });
});
