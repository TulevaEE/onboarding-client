import { shallow, ShallowWrapper } from 'enzyme';
import { Props, SecondPillarStatusBox } from './SecondPillarStatusBox';
import {
  activeSecondPillar,
  activeSecondPillarBondFund,
  completeSecondPillarConversion,
  highFeeSecondPillar,
  tulevaSecondPillarFund,
} from '../fixtures';

// TODO: Figure out a cleaner way to mock the hooks
jest.mock('../../../common/apiHooks', () => ({
  usePendingApplications: () => ({ data: [{ type: 'WITHDRAWAL' }] }),
  useTransactions: () => ({ data: [{ amount: 100 }] }),
  useFunds: () => ({ data: [{ pillar: 2 }] }),
  useMandateDeadlines: () => ({ data: { periodEnding: '2024-07-31T00:59:59.999999999Z' } }),
  useFundPensionStatus: () => ({ fundPensions: [] }),
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
