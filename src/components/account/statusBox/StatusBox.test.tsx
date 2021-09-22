import React from 'react';
import { shallow } from 'enzyme';
import { StatusBox } from './StatusBox';
import { Fund } from './types';

jest.unmock('retranslate');

describe('Status Box', () => {
  const conversion = {
    secondPillar: {
      selectionComplete: false,
      transfersComplete: false,
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
  const secondPillarFunds: Fund[] = [];
  const thirdPillarFunds: Fund[] = [];
  const props = { conversion, secondPillarFunds, thirdPillarFunds };
  const component = shallow(<StatusBox {...props} />);

  it('renders all subcomponents when present', () => {
    expect(component).toMatchSnapshot();
  });

  it('shows only a loader when some props missing', () => {
    component.setProps({ conversion: undefined });
    expect(component).toMatchSnapshot();
  });
});
