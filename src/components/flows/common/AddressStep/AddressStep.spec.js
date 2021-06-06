import React from 'react';
import { shallow } from 'enzyme';

import { Redirect } from 'react-router-dom';
import { AddressStep } from './AddressStep';
import UpdateUserForm from '../../../contact-details/updateUserForm';

describe('AddressStep', () => {
  let component;
  beforeEach(() => {
    component = shallow(<AddressStep nextPath="/next-path" pillar={2} />);
  });

  const redirects = () => component.contains(<Redirect to="/next-path" />);

  it('redirects to next path only when address is already filled in 2nd pillar', () => {
    component.setProps({ pillar: 2, hasAddress: false });
    expect(redirects()).toBe(false);
    component.setProps({ pillar: 2, hasAddress: true });
    expect(redirects()).toBe(true);
  });

  it('redirects to next path only when address is already filled and aml check passed in 3rd pillar', () => {
    component.setProps({
      pillar: 3,
      hasAddress: false,
      hasContactDetailsAmlCheck: false,
    });
    expect(redirects()).toBe(false);
    component.setProps({
      pillar: 3,
      hasAddress: false,
      hasContactDetailsAmlCheck: true,
    });
    expect(redirects()).toBe(false);
    component.setProps({
      pillar: 3,
      hasAddress: true,
      hasContactDetailsAmlCheck: false,
    });
    expect(redirects()).toBe(false);
    component.setProps({
      pillar: 3,
      hasAddress: true,
      hasContactDetailsAmlCheck: true,
    });
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
    component.setProps({
      updateOnlyEmailAndPhone,
      updateEmailAndPhone,
      updateFullUser,
    });
    expect(component.find(UpdateUserForm).exists()).toBe(true);

    component.find(UpdateUserForm).simulate('submit', user);

    expect(updateEmailAndPhone).toBeCalledWith(user);
    expect(updateFullUser).not.toHaveBeenCalled();
  });
});
