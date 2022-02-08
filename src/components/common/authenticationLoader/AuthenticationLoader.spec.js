import React from 'react';
import { shallow } from 'enzyme';

import { FormattedMessage } from 'react-intl';
import AuthenticationLoader from './AuthenticationLoader';
import { Loader } from '..';

describe('Authenticaion loader', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {};
    component = shallow(<AuthenticationLoader {...props} />);
  });

  it('shows a loader', () => {
    expect(component.contains(<Loader className="align-middle" />)).toBe(true);
  });

  it('does not show the control code message if no control code given', () => {
    expect(component.contains(<FormattedMessage id="login.control.code" />)).toBe(false);
  });

  it('shows the control code and the control code message if the code is given', () => {
    const controlCode = '1337';
    component.setProps({ controlCode });
    expect(component.text()).toContain(controlCode);
    expect(component.contains(<FormattedMessage id="login.control.code" />)).toBe(true);
  });

  it('can cancel authentication', () => {
    const onCancel = jest.fn();
    component.setProps({ onCancel, controlCode: '1337' });
    const clickButton = () => component.find('button').simulate('click');
    expect(component.contains(<FormattedMessage id="login.stop" />)).toBe(true);
    expect(onCancel).not.toHaveBeenCalled();
    clickButton();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('can not cancel when no control code yet present', () => {
    expect(component.contains(<FormattedMessage id="login.stop" />)).toBe(false);
  });

  it('renders as a modal when it is overlayed', () => {
    const isComponentModal = () => component.at(0).hasClass('tv-modal');
    expect(isComponentModal()).toBe(false);
    component.setProps({ overlayed: true });
    expect(isComponentModal()).toBe(true);
  });
});
