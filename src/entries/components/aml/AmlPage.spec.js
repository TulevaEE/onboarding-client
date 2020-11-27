import React from 'react';
import { shallow } from 'enzyme';
import UpdateUserForm from '../contact-details/updateUserForm';
import { AmlPage } from './AmlPage';

describe('AML Page', () => {
  let component;
  let props;
  beforeEach(() => {
    props = {};
    component = shallow(<AmlPage {...props} />);
  });
  it('shows update user form', () => {
    const saveUser = () => null;
    component.setProps({ saveUser });
    expect(component.contains(<UpdateUserForm onSubmit={saveUser} />)).toBe(true);
  });
});
