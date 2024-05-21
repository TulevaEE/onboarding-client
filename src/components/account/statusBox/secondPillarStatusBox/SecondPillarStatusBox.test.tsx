import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { Props, SecondPillarStatusBox } from './SecondPillarStatusBox';
import StatusBoxRow from '../statusBoxRow';
import {
  activeSecondPillar,
  completeSecondPillarConversion,
  highFeeSecondPillar,
  tulevaSecondPillarFund,
} from '../fixtures';

// TODO: Figure out a cleaner way to mock the hooks
jest.mock('../../../common/apiHooks', () => ({
  usePendingApplications: () => ({ data: [{ type: 'WITHDRAWAL' }] }),
  useMandateDeadlines: () => ({ data: { periodEnding: '2024-07-31T00:59:59.999999999Z' } }),
}));

jest.useFakeTimers();
jest.setSystemTime(new Date('2024-07-22T10:36:00Z'));

describe('SecondPillarStatusBox', () => {
  let component: ShallowWrapper;
  const props: Props = {
    loading: false,
    conversion: completeSecondPillarConversion.secondPillar,
    sourceFunds: [activeSecondPillar],
    targetFunds: [tulevaSecondPillarFund],
    secondPillarPikNumber: null,
    secondPillarActive: true,
    secondPillarPaymentRate: 6,
  };

  beforeEach(() => {
    component = shallow(<SecondPillarStatusBox {...props} />);
  });

  it('renders the success flow', () => {
    expect(component).toMatchSnapshot();
  });

  it('renders the payment rate flow', () => {
    component.setProps({ secondPillarPaymentRate: 2 });
    expect(component).toMatchSnapshot();
  });

  it('renders no 2nd pillar flow when no second pillar', () => {
    component.setProps({ secondPillarActive: false });
    expect(component).toMatchSnapshot();
  });

  it('does not show action when still loading', () => {
    component.setProps({ loading: true });
    expect(component.find(StatusBoxRow).prop('showAction')).toBeFalsy();
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

  it('renders the PIK flow when fund PIK number present', () => {
    component.setProps({ secondPillarPikNumber: 'EE1234567', sourceFunds: [] });
    expect(component).toMatchSnapshot();
  });
});
