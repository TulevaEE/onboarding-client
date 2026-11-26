import moment from 'moment';
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
import { paymentRateChange, rejoin } from '../../ApplicationSection/fixtures';
import {
  Application,
  RejoinPermission,
  SecondPillarContributions,
} from '../../../common/apiModels';
import { FundPension } from '../../../common/apiModels/withdrawals';

let mockContributionsAreLoaded = true;
let mockEmployeeWithheldPortionThisYear = 100;
let mockFundPensions: FundPension[] = [];
let mockFundPensionsAreLoading = false;
const mockPendingApplicationsByDefault: Partial<Application>[] = [];
let mockPendingApplications = mockPendingApplicationsByDefault;
let mockPendingApplicationsAreLoading = false;
const mockCompletedApplicationsByDefault: Partial<Application>[] = [];
let mockCompletedApplications = mockCompletedApplicationsByDefault;
type RejoinPermissionQuery = {
  data?: RejoinPermission;
  isInitialLoading: boolean;
  isError?: boolean;
};
const mockRejoinPermitted: RejoinPermissionQuery = {
  data: { permitted: true, decision: 'PERMITTED' },
  isInitialLoading: false,
};
const mockRejoinNotPermitted: RejoinPermissionQuery = {
  data: { permitted: false, decision: 'REFUSED_BY_PENSIONIKESKUS' },
  isInitialLoading: false,
};
let mockRejoinPermission = mockRejoinPermitted;
let mockRejoinPermissionAsked = false;
type MandateDeadlinesLoad = 'LOADED' | 'LOADING' | 'FAILED';
let mockMandateDeadlinesLoad: MandateDeadlinesLoad = 'LOADED';
const now = new Date('2024-07-22T10:36:00Z');

// TODO: Figure out a cleaner way to mock the hooks
jest.mock('../../../common/apiHooks', () => ({
  usePendingApplications: () =>
    mockPendingApplicationsAreLoading
      ? { data: undefined, isInitialLoading: true }
      : { data: mockPendingApplications, isInitialLoading: false },
  useCompletedApplications: () => ({ data: mockCompletedApplications, isInitialLoading: false }),
  useTransactions: () => ({ data: [{ amount: 100 }] }),
  useFunds: () => ({ data: [{ pillar: 2 }] }),
  useMandateDeadlines: () => ({
    data:
      mockMandateDeadlinesLoad === 'LOADED'
        ? {
            periodEnding: '2024-07-31T00:59:59.999999999Z',
            secondPillarRejoinContributionStartDate: '2025-01-01',
            paymentRateFulfillmentDate: '2028-01-01',
          }
        : undefined,
    isInitialLoading: mockMandateDeadlinesLoad === 'LOADING',
  }),
  useFundPensionStatus: () =>
    mockFundPensionsAreLoading
      ? { data: undefined, isInitialLoading: true }
      : { data: { fundPensions: mockFundPensions }, isInitialLoading: false },
  useRejoinPermission: () => {
    mockRejoinPermissionAsked = true;
    return mockRejoinPermission;
  },
  useContributions: () => ({
    data: mockContributionsAreLoaded
      ? [
          {
            pillar: 2,
            time: new Date().toISOString(),
            employeeWithheldPortion: mockEmployeeWithheldPortionThisYear,
          },
        ]
      : undefined,
  }),
}));

afterEach(() => {
  mockContributionsAreLoaded = true;
  mockEmployeeWithheldPortionThisYear = 100;
  mockFundPensions = [];
  mockFundPensionsAreLoading = false;
  mockPendingApplications = mockPendingApplicationsByDefault;
  mockPendingApplicationsAreLoading = false;
  mockCompletedApplications = mockCompletedApplicationsByDefault;
  mockRejoinPermission = mockRejoinPermitted;
  mockRejoinPermissionAsked = false;
  mockMandateDeadlinesLoad = 'LOADED';
  jest.setSystemTime(now);
  moment.locale('en');
});

jest.useFakeTimers();
jest.setSystemTime(now);

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
    mockPendingApplications = [{ type: 'WITHDRAWAL' }];
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

const renderWithIntl = (component: React.ReactElement, locale: 'en' | 'et' = 'en') =>
  render(
    <BrowserRouter>
      <IntlProvider
        locale={locale}
        messages={translations[locale]}
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

  describe('without a second pillar', () => {
    const noSecondPillar: Props = {
      loading: false,
      conversion: completeSecondPillarConversion.secondPillar,
      sourceFunds: [],
      targetFunds: [tulevaSecondPillarFund],
      secondPillarActive: false,
      pendingPaymentRate: 2,
      currentPaymentRate: 2,
      activeFundIsin: undefined,
    };

    it('invites a person the server decided may open a second pillar into the second pillar flow', () => {
      renderWithIntl(<SecondPillarStatusBox {...noSecondPillar} nudgeKey="SECOND_PILLAR_START" />);

      expect(screen.getByText(/You have no II\spillar/)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /^Open II\spillar$/ })).toHaveAttribute(
        'href',
        '/2nd-pillar-flow',
      );
    });

    it('shows no call to action when the server decided against a second pillar nudge', () => {
      renderWithIntl(<SecondPillarStatusBox {...noSecondPillar} nudgeKey="NONE" />);

      expect(screen.getByText(/You have no II\spillar/)).toBeInTheDocument();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('shows no call to action while the nudge decision is unknown', () => {
      renderWithIntl(<SecondPillarStatusBox {...noSecondPillar} />);

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('shows a filed rejoin application and when contributions start instead of a missing II pillar', () => {
      mockPendingApplications = [rejoin];

      renderWithIntl(<SecondPillarStatusBox {...noSecondPillar} nudgeKey="SECOND_PILLAR_START" />);

      expect(
        screen.getByText('You rejoined the II pillar. Contributions start on May 1, 2027'),
      ).toBeInTheDocument();
      expect(screen.queryByText(/You have no II\spillar/)).not.toBeInTheDocument();
      expect(screen.getByTestId('status-icon-success')).toBeInTheDocument();
    });

    it('offers no call to action while a rejoin application is pending, so nobody files twice', () => {
      mockPendingApplications = [rejoin];

      renderWithIntl(<SecondPillarStatusBox {...noSecondPillar} nudgeKey="SECOND_PILLAR_START" />);

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('offers no II pillar to open until it is known whether a rejoin application is pending', () => {
      mockPendingApplicationsAreLoading = true;

      renderWithIntl(<SecondPillarStatusBox {...noSecondPillar} nudgeKey="SECOND_PILLAR_START" />);

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('shimmers the II pillar line instead of saying there is none until it is known whether a rejoin application is pending', () => {
      mockPendingApplicationsAreLoading = true;

      renderWithIntl(<SecondPillarStatusBox {...noSecondPillar} nudgeKey="SECOND_PILLAR_START" />);

      expect(screen.getByRole('heading', { name: /^II\spillar$/ })).toBeInTheDocument();
      // eslint-disable-next-line testing-library/no-node-access
      expect(document.querySelector('.shimmerDefault')).toBeInTheDocument();
      expect(screen.queryByText(/You have no II\spillar/)).not.toBeInTheDocument();
      expect(screen.queryByTestId('status-icon-error')).not.toBeInTheDocument();
    });
  });

  describe('InLowFeeFund component', () => {
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

describe('SecondPillarStatusBox for a saver whose II pillar contributions have stopped', () => {
  const saver: Props = {
    loading: false,
    conversion: completeSecondPillarConversion.secondPillar,
    sourceFunds: [activeSecondPillar],
    targetFunds: [tulevaSecondPillarFund],
    secondPillarActive: true,
    pendingPaymentRate: 2,
    currentPaymentRate: 2,
    activeFundIsin: 'EE000123',
  };
  const activeSecondPillarFundPension: FundPension = {
    pillar: 'SECOND',
    active: true,
    startDate: '2024-01-01',
    endDate: null,
    durationYears: 20,
  };
  const contributing: SecondPillarContributions = {
    contributing: true,
    restartDate: null,
    rejoinPossibleFrom: null,
  };
  const notContributing: SecondPillarContributions = {
    contributing: false,
    restartDate: null,
    rejoinPossibleFrom: null,
  };
  const rejoinPossibleFrom = (date: string | null): SecondPillarContributions => ({
    ...notContributing,
    rejoinPossibleFrom: date,
  });

  beforeEach(() => {
    mockPendingApplications = [];
  });

  it('tells a leaver that no contributions are made, in which month they start again, and offers to rejoin', () => {
    renderWithIntl(
      <SecondPillarStatusBox {...saver} secondPillarContributions={notContributing} />,
    );

    expect(screen.getByText('You are not saving in the II pillar')).toBeInTheDocument();
    expect(screen.getByText(/^Apply by/)).toHaveTextContent(
      'Apply by 31 July and contributions start again in January',
    );
    expect(screen.getByRole('link', { name: 'Rejoin' })).toHaveAttribute(
      'href',
      '/2nd-pillar-rejoin',
    );
    expect(screen.getByTestId('status-icon-warning')).toBeInTheDocument();
  });

  it.each([
    [
      'elsewhere in a high-fee fund',
      {
        sourceFunds: [highFeeSecondPillar],
        conversion: {
          ...completeSecondPillarConversion.secondPillar,
          selectionComplete: false,
          transfersComplete: false,
          weightedAverageFee: 0.01,
        },
      },
    ],
    ['at Tuleva with a 2% payment rate', {}],
    ['at Tuleva with a 6% payment rate', { currentPaymentRate: 6, pendingPaymentRate: 6 }],
    [
      'at Tuleva in the payment rate season',
      {
        paymentRateSeason: {
          deadline: '2026-11-30',
          fulfillmentDate: '2027-01-01',
          mode: 'SEASON' as const,
        },
      },
    ],
  ])(
    'shows a leaver whose fund is %s no fee, payment rate or tax win, only the way back in',
    (_, leaver) => {
      renderWithIntl(
        <SecondPillarStatusBox
          {...saver}
          {...leaver}
          secondPillarContributions={notContributing}
        />,
      );

      expect(screen.getAllByTestId('status-box-row')).toHaveLength(1);
      expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
        '/2nd-pillar-rejoin',
      ]);
      expect(screen.queryByText(/%/)).not.toBeInTheDocument();
      expect(screen.queryByText(/€/)).not.toBeInTheDocument();
    },
  );

  it('tells a leaver the register reports as inactive that they are not saving instead of saying there is no II pillar', () => {
    renderWithIntl(
      <SecondPillarStatusBox
        {...saver}
        secondPillarActive={false}
        secondPillarContributions={notContributing}
        nudgeKey="SECOND_PILLAR_START"
      />,
    );

    expect(screen.getByText('You are not saving in the II pillar')).toBeInTheDocument();
    expect(screen.queryByText(/You have no II\spillar/)).not.toBeInTheDocument();
    expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      '/2nd-pillar-rejoin',
    ]);
  });

  it('names the deadline to file the rejoin application, highlighted, after how contributions start again', () => {
    renderWithIntl(
      <SecondPillarStatusBox {...saver} secondPillarContributions={notContributing} />,
    );

    expect(screen.getByText(/^31\sJuly$/, { selector: 'b' })).toHaveClass('highlight');
  });

  it('names the deadline to rejoin in Estonian', () => {
    moment.locale('et');
    renderWithIntl(
      <SecondPillarStatusBox {...saver} secondPillarContributions={notContributing} />,
      'et',
    );

    expect(screen.getByText(/^31\.\sjuuliks$/, { selector: 'b' })).toHaveClass('highlight');
    expect(screen.getByText('Sa ei kogu II sambas')).toBeInTheDocument();
    expect(screen.getByText(/^Esita avaldus/)).toHaveTextContent(
      'Esita avaldus 31. juuliks ja sissemaksed algavad uuesti jaanuaris',
    );
  });

  it('shimmers the way back in until the filing window is known, instead of swapping one sentence for another', () => {
    mockMandateDeadlinesLoad = 'LOADING';
    renderWithIntl(
      <SecondPillarStatusBox {...saver} secondPillarContributions={notContributing} />,
    );

    expect(screen.queryByText(/Apply by/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Contributions start again/)).not.toBeInTheDocument();
  });

  it('says contributions start again once they file to rejoin when the filing window cannot be loaded', () => {
    mockMandateDeadlinesLoad = 'FAILED';
    renderWithIntl(
      <SecondPillarStatusBox {...saver} secondPillarContributions={notContributing} />,
    );

    expect(
      screen.getByText('Contributions start again only once you file an application to rejoin'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Apply by/)).not.toBeInTheDocument();
  });

  it('names no deadline when Pensionikeskus says the leaver cannot rejoin', () => {
    mockRejoinPermission = mockRejoinNotPermitted;
    renderWithIntl(
      <SecondPillarStatusBox {...saver} secondPillarContributions={notContributing} />,
    );

    expect(screen.queryByText(/Apply by/)).not.toBeInTheDocument();
  });

  it('tells a leaver with no fund choice on record the same, without mentioning a fund choice', () => {
    renderWithIntl(
      <SecondPillarStatusBox
        {...saver}
        secondPillarActive={false}
        secondPillarContributions={notContributing}
      />,
    );

    expect(screen.getByText(/^Apply by/)).toBeInTheDocument();
    expect(screen.queryByText(/fund choice/)).not.toBeInTheDocument();
  });

  it('shimmers the way back in until Pensionikeskus says whether the leaver may rejoin', () => {
    mockRejoinPermission = { data: undefined, isInitialLoading: true };

    renderWithIntl(
      <SecondPillarStatusBox {...saver} secondPillarContributions={notContributing} />,
    );

    expect(screen.getByText('You are not saving in the II pillar')).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-node-access
    expect(document.querySelector('.shimmerDefault')).toBeInTheDocument();
    expect(screen.queryByText(/start again/)).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it.each([true, false])(
    'tells a leaver whose contributions ended less than five years ago when they can rejoin instead of offering it, when the register reports the II pillar as active is %s',
    (secondPillarActive) => {
      mockRejoinPermission = mockRejoinNotPermitted;

      renderWithIntl(
        <SecondPillarStatusBox
          {...saver}
          secondPillarActive={secondPillarActive}
          secondPillarContributions={notContributing}
        />,
      );

      expect(screen.getByText('You are not saving in the II pillar')).toBeInTheDocument();
      expect(
        screen.getByText('Pensionikeskus does not let you rejoin the II pillar at the moment'),
      ).toBeInTheDocument();
      expect(screen.queryByText(/start again/)).not.toBeInTheDocument();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    },
  );

  it('explains to a leaver whose contributions cannot restart why they cannot rejoin, even with a date on record', () => {
    mockRejoinPermission = {
      data: { permitted: false, decision: 'CONTRIBUTIONS_CANNOT_RESTART' },
      isInitialLoading: false,
    };

    renderWithIntl(
      <SecondPillarStatusBox
        {...saver}
        secondPillarContributions={rejoinPossibleFrom('2099-12-01')}
      />,
    );

    expect(
      screen.getByText('After a retirement-age payout, you cannot rejoin the II pillar'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/You can rejoin from/)).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('tells a leaver whose contributions ended less than five years ago the day they can rejoin from', () => {
    mockRejoinPermission = mockRejoinNotPermitted;

    renderWithIntl(
      <SecondPillarStatusBox
        {...saver}
        secondPillarContributions={rejoinPossibleFrom('2028-09-01')}
      />,
    );

    expect(screen.getByText('You can rejoin from September 1, 2028')).toBeInTheDocument();
    expect(screen.queryByText(/does not let you rejoin/)).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByTestId('status-icon-warning')).toBeInTheDocument();
  });

  it('tells a leaver in Estonian the day they can rejoin from, in the elative after "alates"', () => {
    mockRejoinPermission = mockRejoinNotPermitted;
    moment.locale('et');

    renderWithIntl(
      <SecondPillarStatusBox
        {...saver}
        secondPillarContributions={rejoinPossibleFrom('2028-09-01')}
      />,
      'et',
    );

    expect(screen.getByText('Taasliituda saad alates 1. septembrist 2028')).toBeInTheDocument();
  });

  it.each([
    ['unknown', null],
    ['today', '2024-07-22'],
    ['in the past', '2021-09-01'],
  ])(
    'keeps saying a leaver can rejoin five years after their contributions ended when the day they can rejoin from is %s',
    (_, date) => {
      mockRejoinPermission = mockRejoinNotPermitted;

      renderWithIntl(
        <SecondPillarStatusBox {...saver} secondPillarContributions={rejoinPossibleFrom(date)} />,
      );

      expect(
        screen.getByText('Pensionikeskus does not let you rejoin the II pillar at the moment'),
      ).toBeInTheDocument();
      expect(screen.queryByText(/You can rejoin from/)).not.toBeInTheDocument();
    },
  );

  it('counts the day a leaver can rejoin from as today once it has begun in Tallinn, though not yet in UTC', () => {
    jest.setSystemTime(new Date('2028-08-31T21:30:00Z'));
    mockRejoinPermission = mockRejoinNotPermitted;

    renderWithIntl(
      <SecondPillarStatusBox
        {...saver}
        secondPillarContributions={rejoinPossibleFrom('2028-09-01')}
      />,
    );

    expect(
      screen.getByText('Pensionikeskus does not let you rejoin the II pillar at the moment'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/You can rejoin from/)).not.toBeInTheDocument();
  });

  it('offers the way back in without a date when Pensionikeskus permits the rejoin', () => {
    renderWithIntl(
      <SecondPillarStatusBox
        {...saver}
        secondPillarContributions={rejoinPossibleFrom('2028-09-01')}
      />,
    );

    expect(screen.getByText(/^Apply by/)).toBeInTheDocument();
    expect(screen.queryByText(/You can rejoin from/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Rejoin' })).toHaveAttribute(
      'href',
      '/2nd-pillar-rejoin',
    );
  });

  it('offers the way back in without promising a deadline when Pensionikeskus could not say whether the leaver may rejoin, as the application asks again at signing', () => {
    mockRejoinPermission = { data: undefined, isInitialLoading: false, isError: true };

    renderWithIntl(
      <SecondPillarStatusBox
        {...saver}
        secondPillarContributions={rejoinPossibleFrom('2028-09-01')}
      />,
    );

    expect(
      screen.getByText('Contributions start again only once you file an application to rejoin'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Apply by/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Rejoin' })).toHaveAttribute(
      'href',
      '/2nd-pillar-rejoin',
    );
    expect(screen.queryByText(/You can rejoin from/)).not.toBeInTheDocument();
  });

  it.each<[string, Partial<Props>, Partial<Application>[], FundPension[]]>([
    ['a contributing saver', { secondPillarContributions: contributing }, [], []],
    ['a saver the register says nothing about', { secondPillarContributions: null }, [], []],
    ['someone without a II pillar', { secondPillarActive: false }, [], []],
    [
      'a rejoiner Pensionikeskus has processed',
      { secondPillarContributions: { ...notContributing, restartDate: '2027-05-01' } },
      [],
      [],
    ],
    [
      'a leaver who has filed to rejoin',
      { secondPillarContributions: notContributing },
      [rejoin],
      [],
    ],
    [
      'a leaver who is withdrawing',
      {
        secondPillarContributions: notContributing,
        conversion: { ...completeSecondPillarConversion.secondPillar, pendingWithdrawal: true },
      },
      [{ id: 456, type: 'WITHDRAWAL' }],
      [],
    ],
    [
      'a pensioner receiving fund pension',
      { secondPillarContributions: notContributing },
      [],
      [activeSecondPillarFundPension],
    ],
  ])(
    'does not ask Pensionikeskus whether %s may rejoin',
    (_, props, pendingApplications, fundPensions) => {
      mockPendingApplications = pendingApplications;
      mockFundPensions = fundPensions;

      renderWithIntl(<SecondPillarStatusBox {...saver} {...props} />);

      expect(mockRejoinPermissionAsked).toBe(false);
    },
  );

  it('says when contributions start again once Pensionikeskus has processed the rejoin', () => {
    renderWithIntl(
      <SecondPillarStatusBox
        {...saver}
        secondPillarContributions={{ ...notContributing, restartDate: '2027-05-01' }}
      />,
    );

    expect(
      screen.getByText('You rejoined the II pillar. Contributions start on May 1, 2027'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('status-icon-success')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('shows a filed rejoin application to a rejoiner the register still reports as active', () => {
    mockPendingApplications = [rejoin];

    renderWithIntl(<SecondPillarStatusBox {...saver} />);

    expect(
      screen.getByText('You rejoined the II pillar. Contributions start on May 1, 2027'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('status-icon-success')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('shows a filed rejoin application rather than the way back in to a leaver who has not started contributing yet', () => {
    mockPendingApplications = [rejoin];

    renderWithIntl(
      <SecondPillarStatusBox {...saver} secondPillarContributions={notContributing} />,
    );

    expect(
      screen.getByText('You rejoined the II pillar. Contributions start on May 1, 2027'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('shimmers the II pillar line of an active saver until it is known whether a rejoin application is pending', () => {
    mockPendingApplicationsAreLoading = true;

    renderWithIntl(<SecondPillarStatusBox {...saver} />);

    expect(screen.getByRole('heading', { name: /^II\spillar$/ })).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-node-access
    expect(document.querySelector('.shimmerDefault')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('shows a contributing saver their II pillar line at once, as only a leaver can have a rejoin application pending', () => {
    mockPendingApplicationsAreLoading = true;

    renderWithIntl(<SecondPillarStatusBox {...saver} secondPillarContributions={contributing} />);

    // eslint-disable-next-line testing-library/no-node-access
    expect(document.querySelector('.shimmerDefault')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Increase contribution' })).toHaveAttribute(
      'href',
      '/2nd-pillar-payment-rate',
    );
  });

  it('keeps the pending withdrawal and its cancellation for a saver whose contributions have stopped', () => {
    mockPendingApplications = [{ id: 456, type: 'WITHDRAWAL' }];

    renderWithIntl(
      <SecondPillarStatusBox
        {...saver}
        conversion={{ ...completeSecondPillarConversion.secondPillar, pendingWithdrawal: true }}
        secondPillarContributions={notContributing}
      />,
    );

    expect(screen.getByText('You are leaving II pillar')).toBeInTheDocument();
    expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      '/applications/456/cancellation',
    ]);
  });

  it('keeps the fund pension row for a pensioner whose contributions ended with the fund pension', () => {
    mockFundPensions = [activeSecondPillarFundPension];

    renderWithIntl(
      <SecondPillarStatusBox {...saver} secondPillarContributions={notContributing} />,
    );

    expect(
      screen.getByText(
        'Contributions have ended and you are receiving regular fund pension payments',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  describe.each([
    ['the register still has their fund choice', true],
    ['the register has no fund choice', false],
  ])('for a person on a II pillar payout when %s', (_, secondPillarActive) => {
    const withPendingWithdrawal = {
      ...completeSecondPillarConversion.secondPillar,
      pendingWithdrawal: true,
    };
    const renderStoppedSaver = (conversion = saver.conversion) =>
      renderWithIntl(
        <SecondPillarStatusBox
          {...saver}
          conversion={conversion}
          secondPillarActive={secondPillarActive}
          secondPillarContributions={notContributing}
        />,
      );
    const expectNothingAboutRejoining = () => {
      expect(screen.queryByText('You are not saving in the II pillar')).not.toBeInTheDocument();
      expect(screen.queryByText(/rejoin/i)).not.toBeInTheDocument();
      expect(mockRejoinPermissionAsked).toBe(false);
    };

    it('shows a fund pension application filed in the app, which the conversion does not count as a pending withdrawal', () => {
      mockPendingApplications = [{ id: 456, type: 'FUND_PENSION_OPENING' }];

      renderStoppedSaver();

      expect(
        screen.getByText('You have a pending fund pension application for regular payments'),
      ).toBeInTheDocument();
      expectNothingAboutRejoining();
    });

    it('shows a partial withdrawal application filed in the app', () => {
      mockPendingApplications = [{ id: 456, type: 'PARTIAL_WITHDRAWAL' }];

      renderStoppedSaver(withPendingWithdrawal);

      expect(
        screen.getByText('You have a pending partial withdrawal application'),
      ).toBeInTheDocument();
      expectNothingAboutRejoining();
    });

    it('shows a pending early withdrawal and its cancellation', () => {
      mockPendingApplications = [{ id: 456, type: 'EARLY_WITHDRAWAL' }];

      renderStoppedSaver(withPendingWithdrawal);

      expect(screen.getByText('You are leaving II pillar')).toBeInTheDocument();
      expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
        '/applications/456/cancellation',
      ]);
      expectNothingAboutRejoining();
    });

    it('shows a fund pension that is paying out', () => {
      mockFundPensions = [activeSecondPillarFundPension];

      renderStoppedSaver();

      expect(
        screen.getByText(
          'Contributions have ended and you are receiving regular fund pension payments',
        ),
      ).toBeInTheDocument();
      expectNothingAboutRejoining();
    });

    it('shows a new partial withdrawal ahead of the fund pension that is paying out', () => {
      mockFundPensions = [activeSecondPillarFundPension];
      mockPendingApplications = [{ id: 456, type: 'PARTIAL_WITHDRAWAL' }];

      renderStoppedSaver(withPendingWithdrawal);

      expect(
        screen.getByText('You have a pending partial withdrawal application'),
      ).toBeInTheDocument();
      expect(screen.queryByText(/receiving regular fund pension/)).not.toBeInTheDocument();
    });

    it('offers the way back in instead of an empty row when the pending withdrawal is not among their applications', () => {
      mockPendingApplications = [];

      renderStoppedSaver(withPendingWithdrawal);

      expect(screen.getByText('You are not saving in the II pillar')).toBeInTheDocument();
    });

    it('tells them they cannot rejoin once the fund pension has ended', () => {
      mockFundPensions = [{ ...activeSecondPillarFundPension, active: false }];
      mockRejoinPermission = {
        data: { permitted: false, decision: 'CONTRIBUTIONS_CANNOT_RESTART' },
        isInitialLoading: false,
      };

      renderStoppedSaver();

      expect(screen.getByText('You are not saving in the II pillar')).toBeInTheDocument();
      expect(
        screen.getByText('After a retirement-age payout, you cannot rejoin the II pillar'),
      ).toBeInTheDocument();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });

  it('shows the fund pension to a pensioner whose last contributions are still coming', () => {
    mockFundPensions = [activeSecondPillarFundPension];

    renderWithIntl(<SecondPillarStatusBox {...saver} secondPillarContributions={contributing} />);

    expect(
      screen.getByText(
        'Contributions have ended and you are receiving regular fund pension payments',
      ),
    ).toBeInTheDocument();
    expect(mockRejoinPermissionAsked).toBe(false);
  });

  it('shows a contributing saver their pending fund pension application instead of the payment rate nudge', () => {
    mockPendingApplications = [{ id: 456, type: 'FUND_PENSION_OPENING' }];

    renderWithIntl(<SecondPillarStatusBox {...saver} secondPillarContributions={contributing} />);

    expect(
      screen.getByText('You have a pending fund pension application for regular payments'),
    ).toBeInTheDocument();
  });

  it('does not mistake a III pillar fund pension for a II pillar one', () => {
    mockFundPensions = [{ ...activeSecondPillarFundPension, pillar: 'THIRD' }];

    renderWithIntl(
      <SecondPillarStatusBox {...saver} secondPillarContributions={notContributing} />,
    );

    expect(screen.getByText('You are not saving in the II pillar')).toBeInTheDocument();
    expect(screen.queryByText(/receiving regular fund pension/)).not.toBeInTheDocument();
  });

  it('shimmers instead of mentioning rejoining until it is known whether a person who stopped contributing is on a fund pension', () => {
    mockFundPensionsAreLoading = true;

    renderWithIntl(
      <SecondPillarStatusBox {...saver} secondPillarContributions={notContributing} />,
    );

    expect(screen.getByRole('heading', { name: /^II\spillar$/ })).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-node-access
    expect(document.querySelector('.shimmerDefault')).toBeInTheDocument();
    expect(screen.queryByText('You are not saving in the II pillar')).not.toBeInTheDocument();
    expect(mockRejoinPermissionAsked).toBe(false);
  });

  it('shows a contributing saver their II pillar line at once while it is still loading whether they have a fund pension', () => {
    mockFundPensionsAreLoading = true;

    renderWithIntl(<SecondPillarStatusBox {...saver} secondPillarContributions={contributing} />);

    // eslint-disable-next-line testing-library/no-node-access
    expect(document.querySelector('.shimmerDefault')).not.toBeInTheDocument();
  });

  it('shimmers instead of an empty row until the pending withdrawal of a contributing saver has loaded', () => {
    mockPendingApplicationsAreLoading = true;

    renderWithIntl(
      <SecondPillarStatusBox
        {...saver}
        conversion={{ ...completeSecondPillarConversion.secondPillar, pendingWithdrawal: true }}
        secondPillarContributions={contributing}
      />,
    );

    expect(screen.getByRole('heading', { name: /^II\spillar$/ })).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-node-access
    expect(document.querySelector('.shimmerDefault')).toBeInTheDocument();
  });

  it.each([
    ['contributing', contributing],
    ['unknown', null],
    ['absent', undefined],
  ])(
    'keeps the payment rate nudge of a saver at Tuleva whose contributions are %s',
    (_, secondPillarContributions) => {
      renderWithIntl(
        <SecondPillarStatusBox {...saver} secondPillarContributions={secondPillarContributions} />,
      );

      expect(screen.getByRole('link', { name: 'Increase contribution' })).toHaveAttribute(
        'href',
        '/2nd-pillar-payment-rate',
      );
      expect(screen.queryByText(/You are not saving/)).not.toBeInTheDocument();
    },
  );

  it.each([
    ['contributing', contributing],
    ['unknown', null],
    ['absent', undefined],
  ])(
    'keeps the transfer nudge of a saver in a high-fee fund whose contributions are %s',
    (_, secondPillarContributions) => {
      renderWithIntl(
        <SecondPillarStatusBox
          {...saver}
          sourceFunds={[highFeeSecondPillar]}
          conversion={{
            ...completeSecondPillarConversion.secondPillar,
            selectionComplete: false,
            transfersComplete: false,
            weightedAverageFee: 0.01,
          }}
          secondPillarContributions={secondPillarContributions}
        />,
      );

      expect(screen.getByRole('link', { name: 'Choose Tuleva' })).toBeInTheDocument();
      expect(screen.queryByText(/You are not saving/)).not.toBeInTheDocument();
    },
  );

  it.each([null, undefined])(
    'keeps saying there is no II pillar when the register reports none and the contributions are %s',
    (secondPillarContributions) => {
      renderWithIntl(
        <SecondPillarStatusBox
          {...saver}
          secondPillarActive={false}
          secondPillarContributions={secondPillarContributions}
        />,
      );

      expect(screen.getByText(/You have no II\spillar/)).toBeInTheDocument();
      expect(screen.queryByText(/You are not saving/)).not.toBeInTheDocument();
    },
  );
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
    expect(byTextContent(/^22\s€$/)).toHaveClass('text-nowrap');
  });

  it('says in Estonian what the person has won this year, then the support sentence of the season', () => {
    moment.locale('et');

    renderWithIntl(<SecondPillarStatusBox {...seasonProps(6, 6)} />, 'et');

    expect(
      byTextContent(
        /^Oled\ssel\saastal\svõitnud\stulumaksult\s22\s€\.\sSinu\sotsus\stöötab\sigal\skuul\ssinu\skasuks$/,
      ),
    ).toBeInTheDocument();
  });

  it('gives only the support sentence of the season when there is no tax win this year', () => {
    mockEmployeeWithheldPortionThisYear = 0;

    renderWithIntl(<SecondPillarStatusBox {...seasonProps(6, 6)} />);

    expect(byTextContent(/^Your\sdecision\sworks\sfor\syou\severy\smonth$/)).toBeInTheDocument();
    expect(screen.queryByText(/You have saved/)).not.toBeInTheDocument();
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
        /^You\shave\ssaved\s22\s€\sin\sincome\stax\sthis\syear\.\sThe\sapplication\sdeadline\sis\sNovember\s30$/,
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
        /^You\shave\ssaved\s22\s€\sin\sincome\stax\sthis\syear\.\sYour\sdecision\sworks\sfor\syou\severy\smonth$/,
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
        /^You\shave\ssaved\s22\s€\sin\sincome\stax\sthis\syear\.\sThe\sapplication\sis\sin\sand\sthere\sis\snothing\smore\sto\sdo$/,
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
        /^You\shave\ssaved\s22\s€\sin\sincome\stax\sthis\syear\.\sUntil\sNovember\s30\syou\scan\sraise\sit\sto\s6%$/,
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
        /^You\shave\ssaved\s22\s€\sin\sincome\stax\sthis\syear\.\sYou\scan\schange\syour\schoice\suntil\sNovember\s30$/,
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

    expect(byTextContent(/^The application deadline is November\s30$/).tagName).toBe('B');
  });

  it('shimmers the tax win line instead of guessing while the contributions load', () => {
    mockContributionsAreLoaded = false;

    renderWithIntl(<SecondPillarStatusBox {...seasonProps(2, 2)} />);

    // eslint-disable-next-line testing-library/no-node-access
    expect(document.querySelector('.shimmerDefault')).toBeInTheDocument();
    expect(screen.queryByText(/You have saved/)).not.toBeInTheDocument();
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

describe('SecondPillarStatusBox with a payment rate change pending', () => {
  const pendingChangeTo = (paymentRate: number, fulfillmentDate: string) => ({
    ...paymentRateChange,
    details: { ...paymentRateChange.details, paymentRate, fulfillmentDate },
  });

  const realisedChangeTo = (paymentRate: number, filedAt: string, fulfillmentDate: string) => ({
    ...pendingChangeTo(paymentRate, fulfillmentDate),
    status: 'COMPLETE' as const,
    creationTime: filedAt,
  });

  const saverAtTuleva = (currentPaymentRate: number, pendingPaymentRate: number): Props => ({
    loading: false,
    conversion: completeSecondPillarConversion.secondPillar,
    sourceFunds: [activeSecondPillar],
    targetFunds: [tulevaSecondPillarFund],
    secondPillarActive: true,
    secondPillarContributions: { contributing: true, restartDate: null, rejoinPossibleFrom: null },
    currentPaymentRate,
    pendingPaymentRate,
    activeFundIsin: 'EE000123',
  });

  const inDecemberWhenAChangeFiledTodayTakesEffectInTwoYears = new Date('2026-12-10T10:00:00Z');

  it.each([
    ['fully at Tuleva', saverAtTuleva(2, 6), 6],
    [
      'in another low-fee fund',
      {
        ...saverAtTuleva(2, 6),
        conversion: {
          ...lowFeesNoTulevaConversion.secondPillar,
          transfersPartial: true,
          weightedAverageFee: 0.0029,
        },
      },
      6,
    ],
    ['below 6%', saverAtTuleva(2, 4), 4],
    ['in the bond fund', { ...saverAtTuleva(2, 6), activeFundIsin: 'EE3600109443' }, 6],
  ])(
    'dates the pending change of a saver %s by its own application, not by when a change filed today would take effect',
    (_, props, pendingPaymentRate) => {
      jest.setSystemTime(inDecemberWhenAChangeFiledTodayTakesEffectInTwoYears);
      mockPendingApplications = [pendingChangeTo(pendingPaymentRate, '2027-01-01')];

      renderWithIntl(<SecondPillarStatusBox {...props} />);

      expect(
        byTextContent(
          new RegExp(
            `^You\\sare\\scontributing\\s2%\\sof\\sgross\\ssalary,\\schanging\\sto\\s${pendingPaymentRate}%\\sfrom\\sJanuary\\s1,\\s2027$`,
          ),
        ),
      ).toBeInTheDocument();
    },
  );

  it('names the date the pending change takes effect before December too', () => {
    mockPendingApplications = [pendingChangeTo(6, '2025-01-01')];

    renderWithIntl(<SecondPillarStatusBox {...saverAtTuleva(2, 6)} />);

    expect(
      byTextContent(
        /^You\sare\scontributing\s2%\sof\sgross\ssalary,\schanging\sto\s6%\sfrom\sJanuary\s1,\s2025$/,
      ),
    ).toBeInTheDocument();
  });

  it('names the date in Estonian in the elative after "alates"', () => {
    moment.locale('et');
    mockPendingApplications = [pendingChangeTo(6, '2027-01-01')];

    renderWithIntl(<SecondPillarStatusBox {...saverAtTuleva(2, 6)} />, 'et');

    expect(
      byTextContent(
        /^Sa\spanustad\s2%\sbrutopalgast,\salates\s1\.\sjaanuarist\s2027\smuutub\ssee\s6%\speale$/,
      ),
    ).toBeInTheDocument();
  });

  it('dates the change by the application for the pending rate on record when an older application asked for another rate', () => {
    mockPendingApplications = [pendingChangeTo(6, '2027-01-01'), pendingChangeTo(4, '2027-01-01')];

    renderWithIntl(<SecondPillarStatusBox {...saverAtTuleva(2, 4)} />);

    expect(
      byTextContent(
        /^You\sare\scontributing\s2%\sof\sgross\ssalary,\schanging\sto\s4%\sfrom\sJanuary\s1,\s2027$/,
      ),
    ).toBeInTheDocument();
  });

  it('dates the change by its application once Pensionikeskus has marked it realised, as it does from December', () => {
    jest.setSystemTime(inDecemberWhenAChangeFiledTodayTakesEffectInTwoYears);
    mockCompletedApplications = [realisedChangeTo(6, '2026-11-10T10:00:00Z', '2027-01-01')];

    renderWithIntl(<SecondPillarStatusBox {...saverAtTuleva(2, 6)} />);

    expect(
      byTextContent(
        /^You\sare\scontributing\s2%\sof\sgross\ssalary,\schanging\sto\s6%\sfrom\sJanuary\s1,\s2027$/,
      ),
    ).toBeInTheDocument();
  });

  it('dates the change by the newest application for the rate on record, not by an older one that asked for the same rate', () => {
    mockCompletedApplications = [
      realisedChangeTo(6, '2022-11-10T10:00:00Z', '2023-01-01'),
      realisedChangeTo(6, '2026-11-10T10:00:00Z', '2027-01-01'),
      realisedChangeTo(6, '2023-11-10T10:00:00Z', '2024-01-01'),
    ];

    renderWithIntl(<SecondPillarStatusBox {...saverAtTuleva(2, 6)} />);

    expect(
      byTextContent(
        /^You\sare\scontributing\s2%\sof\sgross\ssalary,\schanging\sto\s6%\sfrom\sJanuary\s1,\s2027$/,
      ),
    ).toBeInTheDocument();
  });

  it('names the pending change without a date when no application holds the rate on record', () => {
    renderWithIntl(<SecondPillarStatusBox {...saverAtTuleva(2, 6)} />);

    expect(
      byTextContent(/^You\sare\scontributing\s2%\sof\sgross\ssalary,\schanging\sto\s6%$/),
    ).toBeInTheDocument();
  });

  it('names the pending change without a date in Estonian', () => {
    moment.locale('et');

    renderWithIntl(<SecondPillarStatusBox {...saverAtTuleva(2, 6)} />, 'et');

    expect(
      byTextContent(/^Sa\spanustad\s2%\sbrutopalgast,\ssee\smuutub\s6%\speale$/),
    ).toBeInTheDocument();
  });

  it('announces no change when the pending application keeps the rate the saver already contributes', () => {
    mockPendingApplications = [pendingChangeTo(6, '2027-01-01')];

    renderWithIntl(<SecondPillarStatusBox {...saverAtTuleva(6, 6)} />);

    expect(screen.queryByText(/changing to/)).not.toBeInTheDocument();
    expect(
      byTextContent(
        /^You\sare\scontributing\s6%\sof\sgross\ssalary\sand\shave\ssaved\s22\s€\sin\sincome\stax\sthis\syear$/,
      ),
    ).toBeInTheDocument();
  });

  it('shimmers the payment rate line instead of guessing the date until the applications load', () => {
    mockPendingApplicationsAreLoading = true;

    renderWithIntl(<SecondPillarStatusBox {...saverAtTuleva(2, 6)} />);

    expect(screen.getByRole('heading', { name: /^II\spillar$/ })).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-node-access
    expect(document.querySelector('.shimmerDefault')).toBeInTheDocument();
    expect(screen.queryByText(/You are contributing/)).not.toBeInTheDocument();
  });
});

describe('SecondPillarStatusBox payment rate and tax win lines outside the season', () => {
  const saver = (currentPaymentRate: number, pendingPaymentRate: number): Props => ({
    loading: false,
    conversion: completeSecondPillarConversion.secondPillar,
    sourceFunds: [activeSecondPillar],
    targetFunds: [tulevaSecondPillarFund],
    secondPillarActive: true,
    secondPillarContributions: { contributing: true, restartDate: null, rejoinPossibleFrom: null },
    currentPaymentRate,
    pendingPaymentRate,
    activeFundIsin: 'EE000123',
  });

  const inAnotherLowFeeFund = (props: Props): Props => ({
    ...props,
    conversion: {
      ...lowFeesNoTulevaConversion.secondPillar,
      transfersPartial: true,
      weightedAverageFee: 0.0029,
    },
  });

  beforeEach(() => {
    moment.locale('et');
  });

  it.each([
    ['at Tuleva', saver(6, 6), 'Sa kogud Tuleva madala tasuga indeksfondis'],
    ['in another low-fee fund', inAnotherLowFeeFund(saver(6, 6)), 'Sa kogud madala tasuga fondis'],
  ])(
    'tells a saver %s at 6%% the rate and the tax win in one line under the fund, like the III pillar row',
    (_, props, fundLine) => {
      renderWithIntl(<SecondPillarStatusBox {...props} />, 'et');

      expect(byTextContent(fundLine)).toBeInTheDocument();
      expect(
        byTextContent(
          /^Sa\spanustad\s6%\sbrutopalgast\sja\soled\ssel\saastal\svõitnud\stulumaksult\s22\s€$/,
        ),
      ).toBeInTheDocument();
      expect(screen.queryByText(/^Sa\spanustad\s6%\sbrutopalgast$/)).not.toBeInTheDocument();
    },
  );

  it('joins the rate and the tax win in English too', () => {
    moment.locale('en');

    renderWithIntl(<SecondPillarStatusBox {...saver(6, 6)} />);

    expect(
      byTextContent(
        /^You\sare\scontributing\s6%\sof\sgross\ssalary\sand\shave\ssaved\s22\s€\sin\sincome\stax\sthis\syear$/,
      ),
    ).toBeInTheDocument();
  });

  it('keeps the tax win amount bold and on one line, like the III pillar amounts', () => {
    renderWithIntl(<SecondPillarStatusBox {...saver(6, 6)} />, 'et');

    expect(byTextContent(/^22\s€$/).tagName).toBe('B');
    expect(byTextContent(/^22\s€$/)).toHaveClass('text-nowrap');
    expect(screen.getByRole('link', { name: /^võitnud\stulumaksult$/ })).toHaveAttribute(
      'href',
      '/2nd-pillar-tax-win',
    );
  });

  it.each([
    ['at Tuleva', saver(2, 6)],
    ['in another low-fee fund', inAnotherLowFeeFund(saver(2, 6))],
  ])(
    'gives a saver %s with a pending raise the change and the tax win on lines of their own',
    (_, props) => {
      mockPendingApplications = [
        {
          ...paymentRateChange,
          details: { ...paymentRateChange.details, paymentRate: 6, fulfillmentDate: '2027-01-01' },
        },
      ];

      renderWithIntl(<SecondPillarStatusBox {...props} />, 'et');

      expect(
        byTextContent(
          /^Sa\spanustad\s2%\sbrutopalgast,\salates\s1\.\sjaanuarist\s2027\smuutub\ssee\s6%\speale$/,
        ),
      ).toBeInTheDocument();
      expect(byTextContent(/^Oled\ssel\saastal\svõitnud\stulumaksult\s22\s€$/)).toBeInTheDocument();
    },
  );

  it('gives a saver below 6% the rate and the tax win on lines of their own', () => {
    renderWithIntl(<SecondPillarStatusBox {...saver(2, 2)} />, 'et');

    expect(byTextContent(/^Sa\spanustad\s2%\sbrutopalgast$/)).toBeInTheDocument();
    expect(byTextContent(/^Oled\ssel\saastal\svõitnud\stulumaksult\s22\s€$/)).toBeInTheDocument();
  });

  it('shimmers the line of the rate and the tax win until the contributions load', () => {
    mockContributionsAreLoaded = false;

    renderWithIntl(<SecondPillarStatusBox {...saver(6, 6)} />, 'et');

    expect(screen.getByText('Sa kogud Tuleva madala tasuga indeksfondis')).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-node-access
    expect(document.querySelector('.shimmerDefault')).toBeInTheDocument();
    expect(screen.queryByText(/panustad/)).not.toBeInTheDocument();
  });

  it('counts a tax win that rounds to 0 € as none', () => {
    mockEmployeeWithheldPortionThisYear = 1;

    renderWithIntl(<SecondPillarStatusBox {...saver(6, 6)} />, 'et');

    expect(byTextContent(/^Sa\spanustad\s6%\sbrutopalgast$/)).toBeInTheDocument();
    expect(screen.queryByText(/tulumaksult/)).not.toBeInTheDocument();
  });

  it('gives only the rate when there is no tax win this year', () => {
    mockEmployeeWithheldPortionThisYear = 0;

    renderWithIntl(<SecondPillarStatusBox {...saver(6, 6)} />, 'et');

    expect(byTextContent(/^Sa\spanustad\s6%\sbrutopalgast$/)).toBeInTheDocument();
    expect(screen.queryByText(/tulumaksult/)).not.toBeInTheDocument();
  });
});
