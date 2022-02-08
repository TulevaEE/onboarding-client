import React from 'react';
import { shallow } from 'enzyme';

import { FormattedMessage } from 'react-intl';
import { PoliticallyExposedPersonAgreement } from './PoliticallyExposedPersonAgreement';

describe('PoliticallyExposedPersonAgreement', () => {
  let component;
  beforeEach(() => {
    component = shallow(<PoliticallyExposedPersonAgreement />);
  });

  it('has default radio checked only when initial state is true', () => {
    const checked = () => component.find('#aml-not-pep-checkbox').prop('checked');

    expect(checked()).toBe(false);
    component.setProps({ isPoliticallyExposed: false });
    expect(checked()).toBe(true);
    component.setProps({ isPoliticallyExposed: true });
    expect(checked()).toBe(false);
  });

  it('submits when checked', () => {
    const mock = jest.fn();
    component.setProps({ onPoliticallyExposedChange: mock });

    component.find('Field').simulate('change', { target: { checked: true } });
    expect(mock).toBeCalledWith(false);

    component.find('Field').simulate('change', { target: { checked: false } });
    expect(mock).toBeCalledWith(true);
  });

  it('has pep tooltip', () => {
    const hasTooltip = () => component.contains(<FormattedMessage id="aml.pepTooltip" />);
    expect(hasTooltip()).toBe(true);
  });
});
