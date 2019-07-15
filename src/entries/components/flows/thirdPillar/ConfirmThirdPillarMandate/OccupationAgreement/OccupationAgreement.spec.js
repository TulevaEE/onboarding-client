import React from 'react';
import { shallow } from 'enzyme';

import { OccupationAgreement } from './OccupationAgreement';

describe('OccupationAgreement', () => {
  let component;
  beforeEach(() => {
    const props = { translations: { translate: () => '' } };
    component = shallow(<OccupationAgreement {...props} />);
  });

  it('submits when changed', () => {
    const mock = jest.fn();
    component.setProps({ onOccupationChange: mock });

    component
      .find('#occupation-agreement')
      .simulate('change', { target: { value: 'PRIVATE_SECTOR' } });
    expect(mock).toBeCalledWith('PRIVATE_SECTOR');

    component
      .find('#occupation-agreement')
      .simulate('change', { target: { value: 'PUBLIC_SECTOR' } });
    expect(mock).toBeCalledWith('PUBLIC_SECTOR');
  });
});
