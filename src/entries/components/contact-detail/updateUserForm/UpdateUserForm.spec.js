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
});
