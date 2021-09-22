import React from 'react';
import { shallow } from 'enzyme';
import { ThirdPillarStatusBox } from './ThirdPillarStatusBox';
import { StatusBoxRow } from '../statusBoxRow/StatusBoxRow';

describe('ThirdPillarStatusBox', () => {
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
      selectionComplete: true,
      transfersComplete: true,
      paymentComplete: true,
      pendingWithdrawal: false,
      contribution: { yearToDate: 300, total: 450 },
      subtraction: { yearToDate: 0, total: 0 },
    },
  };
  const thirdPillarFunds = [
    { activeFund: true, name: 'Aktiivne Fond', fundManager: { name: 'Toivo' }, pillar: 3 },
  ];
  const props = { conversion, loading: false, thirdPillarFunds };
  const component = shallow(<ThirdPillarStatusBox {...props} />);

  it('renders the success flow', () => {
    expect(component).toMatchSnapshot();
  });

  it('does not show action when still loading', () => {
    component.setProps({ loading: true });
    expect(component.find(StatusBoxRow).prop('showAction')).toBeFalsy();
  });

  it('does not render status box OK when not fully converted', () => {
    component.setProps({ conversion: { thirdPillar: { selectionComplete: false } } });
    expect(component.find(StatusBoxRow).prop('ok')).toBeFalsy();
  });
});
