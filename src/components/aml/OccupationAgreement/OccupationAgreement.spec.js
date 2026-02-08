import React from 'react';
import { shallow } from 'enzyme';

import { OccupationAgreement } from './OccupationAgreement';

describe('OccupationAgreement', () => {
  let component;

  beforeEach(() => {
    component = shallow(<OccupationAgreement />);
  });

  it('submits when changed', () => {
    const mock = jest.fn();
    component.setProps({ onOccupationChange: mock });

    component
      .find('#occupation-agreement')
      .simulate('change', { target: { value: 'PRIVATE_SECTOR' } });
    expect(mock).toHaveBeenCalledWith('PRIVATE_SECTOR');

    component
      .find('#occupation-agreement')
      .simulate('change', { target: { value: 'PUBLIC_SECTOR' } });
    expect(mock).toHaveBeenCalledWith('PUBLIC_SECTOR');
  });
});
