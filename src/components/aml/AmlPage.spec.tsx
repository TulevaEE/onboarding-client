import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import UpdateUserForm from '../contact-details/updateUserForm';
import { AmlPage } from './AmlPage';

describe('AML Page', () => {
  let component: ShallowWrapper;
  let props;
  beforeEach(() => {
    props = {};
    component = shallow(<AmlPage {...props} />);
  });
  it('shows update user form', () => {
    const saveUser = () => null;
    component.setProps({ saveUser });
    expect(component.find(UpdateUserForm).length).toBe(1);
  });
});
