import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import { UpdateUserForm } from './UpdateUserForm';

describe('UpdateUserForm', () => {
  let component;
  let props;

  beforeEach(() => {
    props = { translations: { translate: () => '' } };
    component = shallow(<UpdateUserForm {...props} />);
  });

  it('renders component', () => {
    expect(component);
  });

  it('renders success message', () => {
    expect(component.contains(<Message>update.user.success.message</Message>)).toBe(false);

    const updateUserSuccess = true;
    component.setProps({ updateUserSuccess });
    expect(component.contains(<Message>update.user.success.message</Message>)).toBe(true);
  });

  it('renders children given to it', () => {
    const children = <div>child</div>;
    component.setProps({ children });
    expect(component.contains(children)).toBe(true);
  });

  it('disables submit button when form invalid', () => {
    component.setProps({ invalid: true });
    expect(component.find('button').prop('disabled')).toBe(true);
  });

  describe('when form valid', () => {
    beforeEach(() => {
      component.setProps({ invalid: false });
    });

    it('enables the submit button', () => {
      expect(component.find('button').prop('disabled')).toBe(false);
    });

    it('disables submit button when submitting already in progress', () => {
      component.setProps({ submitting: true });
      expect(component.find('button').prop('disabled')).toBe(true);
    });
  });
});
