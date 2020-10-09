import React from 'react';
import { shallow } from 'enzyme';

import { Redirect } from 'react-router-dom';
import { AddressStep } from './AddressStep';
import UpdateUserForm from '../../../contact-details/updateUserForm';

describe('AddressStep', () => {
  let component;
  beforeEach(() => {
    component = shallow(<AddressStep />);
  });

  it('redirects to next path only when address is already filled', () => {
    component.setProps({ nextPath: '/next-path' });
    const redirects = () => component.contains(<Redirect to="/next-path" />);

    component.setProps({ isAddressFilled: false });
    expect(redirects()).toBe(false);
    component.setProps({ isAddressFilled: true });
    expect(redirects()).toBe(true);
  });

  it('updates full user by default', () => {
    const user = 'user';
    const updateFullUser = jest.fn();
    const updateEmailAndPhone = jest.fn();
    component.setProps({ updateEmailAndPhone, updateFullUser });

    component.find(UpdateUserForm).simulate('submit', user);

    expect(updateFullUser).toBeCalledWith(user);
    expect(updateEmailAndPhone).not.toHaveBeenCalled();
  });

  it('can also update only email and phone', () => {
    const user = 'user';
    const updateOnlyEmailAndPhone = true;
    const updateFullUser = jest.fn();
    const updateEmailAndPhone = jest.fn();
    component.setProps({ updateOnlyEmailAndPhone, updateEmailAndPhone, updateFullUser });
    expect(component.find(UpdateUserForm).exists()).toBe(true);

    component.find(UpdateUserForm).simulate('submit', user);

    expect(updateEmailAndPhone).toBeCalledWith(user);
    expect(updateFullUser).not.toHaveBeenCalled();
  });
});
