import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import UpdateUserForm from './updateUserForm';
import { ContactDetailsPage } from './ContactDetailsPage';

describe('Contact detail', () => {
  let component: ShallowWrapper;
  let props;
  beforeEach(() => {
    props = {};
    component = shallow(<ContactDetailsPage {...props} />);
  });
  it('shows update user form', () => {
    const saveUser = () => null;
    component.setProps({ saveUser });
    expect(component.contains(<UpdateUserForm onSubmit={saveUser} />)).toBe(true);
  });
});
