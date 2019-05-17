import React from 'react';
import { shallow } from 'enzyme';

import { PoliticallyExposedPersonAgreement } from './PoliticallyExposedPersonAgreement';

describe('PoliticallyExposedPersonAgreement', () => {
  let component;
  beforeEach(() => {
    component = shallow(<PoliticallyExposedPersonAgreement />);
  });

  it('has default radio checked only when initial state is true', () => {
    const checked = () => component.find('#third-pillar-pep-radio').prop('defaultChecked');

    expect(checked()).toBe(false);
    component.setProps({ isPoliticallyExposed: true });
    expect(checked()).toBe(true);
    component.setProps({ isPoliticallyExposed: false });
    expect(checked()).toBe(false);
  });

  it('submits when checked', () => {
    const mock = jest.fn();
    component.setProps({ onPoliticallyExposedChange: mock });
    component.find('#pep-radio-container').simulate('change', { target: { value: 'true' } });
    expect(mock).toBeCalledWith(true);
    component.find('#pep-radio-container').simulate('change', { target: { value: 'false' } });
    expect(mock).toBeCalledWith(false);
  });
});
