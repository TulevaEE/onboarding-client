import React from 'react';
import { shallow } from 'enzyme';
import UpdateUserForm from './updateUserForm';
import { ContactDetailPage } from './ContactDetailPage';

describe('Contact detail', () => {
  let component;
  let props;
  beforeEach(() => {
    props = {};
    component = shallow(<ContactDetailPage {...props} />);
  });
  it('shows update user form', () => {
    const saveUser = () => null;
    component.setProps({ saveUser });
    expect(component.contains(<UpdateUserForm onSubmit={saveUser} />)).toBe(true);
  });
});
