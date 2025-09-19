import React from 'react';
import { shallow } from 'enzyme';
import { Link } from 'react-router-dom';

import { logo } from '../../common';
import { Header } from '.';
import LanguageSwitcher from './languageSwitcher';
import { Shimmer } from '../../common/shimmer/Shimmer';

describe('Header', () => {
  let component;

  beforeEach(() => {
    component = shallow(<Header />);
  });

  it('shows a header logo with a link', () => {
    expect(
      component.contains(
        <Link to="/account">
          <img src={logo} alt="Tuleva" className="brand-logo" />
        </Link>,
      ),
    ).toBe(true);
  });

  it("shows the user's name when not loading", () => {
    const name = 'A name of a person';
    component.setProps({
      user: { name },
      loading: false,
    });
    expect(component.text()).toContain(name);
    expect(component.contains(<Shimmer height={24} />)).toBe(false);
  });

  it('can log out the user', () => {
    const onLogout = jest.fn();
    component.setProps({ loading: false, onLogout, user: { name: 'name' } });
    expect(onLogout).not.toHaveBeenCalled();
    component.find('[href="/login"]').simulate('click');
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("shows a loader when it's loading", () => {
    component.setProps({ loading: true });
    expect(component.contains(<Shimmer height={24} />)).toBe(true);
  });

  it('renders my account button', () => {
    const onLogout = jest.fn();
    component.setProps({ loading: false, onLogout, user: { name: 'name' } });
    expect(component.find(Link).at(1)).toMatchSnapshot();
  });

  it('renders the language switcher', () => {
    component.setProps({ loading: false, user: { name: 'name' } });
    expect(component.contains(<LanguageSwitcher />)).toBe(true);
  });
});
