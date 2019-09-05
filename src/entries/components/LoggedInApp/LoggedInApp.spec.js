import React from 'react';
import { Route } from 'react-router-dom';
import { shallow } from 'enzyme';

import { LoggedInApp } from './LoggedInApp';
import Header from './header';
import Footer from './footer';
import AccountPage from '../account';

describe('LoggedInApp', () => {
  let component;

  beforeEach(() => {
    component = shallow(<LoggedInApp />);
  });

  it('has account page when user data exist', () => {
    const hasAccountPage = () =>
      component.containsMatchingElement(<Route path="/account" component={AccountPage} />);

    component.setProps({ userDataExists: false });
    expect(hasAccountPage()).toBe(false);
    component.setProps({ userDataExists: true });
    expect(hasAccountPage()).toBe(true);
  });

  it('passes props to the header when loading', () => {
    const user = { name: 'name' };
    const onLogout = jest.fn();
    component.setProps({
      user,
      onLogout,
      loading: true,
    });
    expect(component.contains(<Header user={user} loading onLogout={onLogout} />)).toBe(true);
  });

  it('passes props to the header when not loading', () => {
    const user = { name: 'name' };
    const onLogout = jest.fn();
    component.setProps({
      user,
      onLogout,
      loading: false,
    });
    expect(component.contains(<Header user={user} onLogout={onLogout} />)).toBe(true);
  });

  it('renders a footer', () => {
    expect(component.contains(<Footer />)).toBe(true);
  });
});
