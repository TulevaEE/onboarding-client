import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { SecondPillarStatusBox } from './SecondPillarStatusBox';
import StatusBoxRow from '../statusBoxRow';
import {
  activeSecondPillar,
  completeSecondPillarConversion,
  highFeeSecondPillar,
} from '../fixtures';

// TODO: Figure out a cleaner way to mock applications from the hook
jest.mock('../../../common/apiHooks', () => ({
  usePendingApplications: () => ({ data: [{ type: 'WITHDRAWAL' }] }),
}));

describe('SecondPillarStatusBox', () => {
  let component: ShallowWrapper;
  const props = {
    loading: false,
    conversion: completeSecondPillarConversion.secondPillar,
    secondPillarFunds: [activeSecondPillar],
    secondPillarPikNumber: null,
    secondPillarActive: true,
  };

  beforeEach(() => {
    component = shallow(<SecondPillarStatusBox {...props} />);
  });

  it('renders the success flow', () => {
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

  it('renders the choice flow when fund selection incomplete', () => {
    component.setProps({ conversion: { selectionPartial: false, selectionComplete: false } });
    expect(component).toMatchSnapshot();
  });

  it('renders high fee message when in high fee fund and no partial conversion', () => {
    component.setProps({
      conversion: {
        transfersPartial: false,
        transfersComplete: false,
        selectionPartial: false,
        selectionComplete: false,
      },
      secondPillarFunds: [highFeeSecondPillar],
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
      },
    });
    expect(component).toMatchSnapshot();
  });

  it('renders the PIK flow when fund PIK number present', () => {
    component.setProps({ secondPillarPikNumber: 'EE1234567' });
    expect(component).toMatchSnapshot();
  });
});
