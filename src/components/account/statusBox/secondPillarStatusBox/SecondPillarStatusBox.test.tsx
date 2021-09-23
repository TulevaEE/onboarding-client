import React from 'react';
import { shallow } from 'enzyme';
import { SecondPillarStatusBox } from './SecondPillarStatusBox';
import { StatusBoxRow } from '../statusBoxRow/StatusBoxRow';
import { activeSecondPillar, completeSecondPillarconversion } from '../fixtures';

// TODO: Figure out a cleaner way to mock applications from the hook
jest.mock('../../../common/apiHooks', () => ({
  usePendingApplications: () => ({ data: [{ type: 'WITHDRAWAL' }] }),
}));

describe('SecondPillarStatusBox', () => {
  const props = {
    conversion: completeSecondPillarconversion,
    loading: false,
    secondPillarFunds: [activeSecondPillar],
  };
  const component = shallow(<SecondPillarStatusBox {...props} />);

  it('renders the success flow', () => {
    expect(component).toMatchSnapshot();
  });

  it('does not show action when still loading', () => {
    component.setProps({ loading: true });
    expect(component.find(StatusBoxRow).prop('showAction')).toBeFalsy();
  });

  it('renders the withdrawal flow when withdrawal is in progress', () => {
    component.setProps({ conversion: { secondPillar: { pendingWithdrawal: true } } });
    expect(component).toMatchSnapshot();
  });

  it('renders the choice flow when fund selection incomplete', () => {
    component.setProps({ conversion: { secondPillar: { selectionComplete: false } } });
    expect(component).toMatchSnapshot();
  });

  it('renders the transfer flow when fund transfers incomplete', () => {
    component.setProps({
      conversion: { secondPillar: { transfersComplete: false, selectionComplete: true } },
    });
    expect(component).toMatchSnapshot();
  });
});
