import React from 'react';
import { shallow } from 'enzyme';

import { Redirect } from 'react-router-dom';
import { ThirdPillarAddress } from './ThirdPillarAddress';
import UpdateUserForm from '../../../account/updateUserForm';

const noop = () => null;

describe('ThirdPillarAddress', () => {
  let component;
  beforeEach(() => {
    component = shallow(<ThirdPillarAddress />);
  });

  it('redirects to previous path only when no monthly contribution', () => {
    component.setProps({ previousPath: '/a-path' });
    const redirects = () => component.contains(<Redirect to="/a-path" />);

    component.setProps({ monthlyContribution: 123 });
    expect(redirects()).toBe(false);
    component.setProps({ monthlyContribution: null });
    expect(redirects()).toBe(true);
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
