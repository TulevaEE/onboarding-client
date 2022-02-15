import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { SecondPillarStatusBox } from './SecondPillarStatusBox';
import StatusBoxRow from '../statusBoxRow';
import { activeSecondPillar, completeSecondPillarconversion } from '../fixtures';

// TODO: Figure out a cleaner way to mock applications from the hook
jest.mock('../../../common/apiHooks', () => ({
  usePendingApplications: () => ({ data: [{ type: 'WITHDRAWAL' }] }),
}));

describe('SecondPillarStatusBox', () => {
  let component: ShallowWrapper;
  const props = {
    loading: false,
    secondPillar: completeSecondPillarconversion.secondPillar,
    secondPillarFunds: [activeSecondPillar],
    secondPillarPikNumber: null,
  };

  beforeEach(() => {
    component = shallow(<SecondPillarStatusBox {...props} />);
  });

  it('renders the success flow', () => {
    expect(component).toMatchSnapshot();
  });

  it('does not show action when still loading', () => {
    component.setProps({ loading: true });
    expect(component.find(StatusBoxRow).prop('showAction')).toBeFalsy();
  });

  it('renders the withdrawal flow when withdrawal is in progress', () => {
    component.setProps({ secondPillar: { pendingWithdrawal: true } });
    expect(component).toMatchSnapshot();
  });

  it('renders the choice flow when fund selection incomplete', () => {
    component.setProps({ secondPillar: { selectionComplete: false } });
    expect(component).toMatchSnapshot();
  });

  it('renders the transfer flow when fund transfers incomplete', () => {
    component.setProps({
      secondPillar: { transfersComplete: false, selectionComplete: true },
    });
    expect(component).toMatchSnapshot();
  });

  it('renders the PIK flow when fund PIK number present', () => {
    component.setProps({ secondPillarPikNumber: 'EE1234567' });
    expect(component).toMatchSnapshot();
  });
});
