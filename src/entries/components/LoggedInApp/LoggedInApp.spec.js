import React from 'react';
import { shallow } from 'enzyme';

import { LoggedInApp } from './LoggedInApp';
import Header from './header';
import Footer from './footer';

describe('App', () => {
  let component;

  beforeEach(() => {
    component = shallow(<LoggedInApp />);
  });

  it.skip('renders children given to it', () => {
    const children = <div>we are the children</div>;
    expect(component.text()).not.toContain('we are the children');
    component.setProps({ children });
    expect(component.text()).toContain('we are the children');
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
