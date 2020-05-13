import React from 'react';
import { shallow } from 'enzyme';

import { Redirect } from 'react-router-dom';
import { ThirdPillarAddress } from './ThirdPillarAddress';
import UpdateUserForm from '../../../contact-details/updateUserForm';

const noop = () => null;

describe('ThirdPillarAddress', () => {
  let component;
  beforeEach(() => {
    component = shallow(<ThirdPillarAddress />);
  });

  it('redirects to next path only when address is already filled', () => {
    component.setProps({ nextPath: '/next-path' });
    const redirects = () => component.contains(<Redirect to="/next-path" />);

    component.setProps({ isAddressFilled: false });
    expect(redirects()).toBe(false);
    component.setProps({ isAddressFilled: true });
    expect(redirects()).toBe(true);
  });

  it('renders the user address form', () => {
    const saveUser = noop;
    component.setProps({ saveUser });
    expect(component.contains(<UpdateUserForm onSubmit={saveUser} />)).toBe(true);
  });
});
