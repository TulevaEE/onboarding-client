import React from 'react';
import { shallow } from 'enzyme';
import { SecondPillarStatusBox } from './SecondPillarStatusBox';
import { StatusBoxRow } from '../statusBoxRow/StatusBoxRow';

// TODO: Figure out a cleaner way to mock applications from the hook
jest.mock('../../../common/apiHooks', () => ({
  usePendingApplications: () => ({ data: [{ type: 'WITHDRAWAL' }] }),
}));

describe('SecondPillarStatusBox', () => {
  const conversion = {
    secondPillar: {
      selectionComplete: true,
      transfersComplete: true,
      paymentComplete: false,
      pendingWithdrawal: false,
      contribution: { yearToDate: 200, total: 250 },
      subtraction: { yearToDate: 0, total: 0 },
    },
    thirdPillar: {
      selectionComplete: false,
      transfersComplete: false,
      paymentComplete: false,
      pendingWithdrawal: false,
      contribution: { yearToDate: 300, total: 450 },
      subtraction: { yearToDate: 0, total: 0 },
    },
  };
  const secondPillarFunds = [
    { activeFund: true, name: 'Aktiivne Fond', fundManager: { name: 'Toivo' }, pillar: 2 },
  ];
  const props = { conversion, loading: false, secondPillarFunds };
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
