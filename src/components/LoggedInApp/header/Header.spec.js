import React from 'react';
import { shallow } from 'enzyme';
import config from 'react-global-configuration';

import { logo } from '../../common';
import { Header } from './Header';
import { Shimmer } from '../../common/shimmer/Shimmer';
import { RoleSwitcher } from './roleSwitcher';

describe('Header', () => {
  let component;

  beforeAll(() => {
    config.set({ language: 'et' }, { freeze: false });
  });

  beforeEach(() => {
    component = shallow(<Header />);
  });

  it('shows a header logo with a link', () => {
    expect(
      component.contains(
        <a href="/account">
          <img src={logo} alt="Tuleva" className="brand-logo" />
        </a>,
      ),
    ).toBe(true);
  });

  it("shows the user's name when not loading", () => {
    const name = 'A name of a person';
    component.setProps({
      user: { name },
      loading: false,
    });
    expect(component.find(RoleSwitcher).prop('userName')).toBe(name);
    expect(component.contains(<Shimmer height={32} />)).toBe(false);
  });

  // Logging out lives in the account menu now, so the header only forwards it.
  it('hands logging out to the account menu', () => {
    const onLogout = jest.fn();
    component.setProps({ loading: false, onLogout, user: { name: 'name' } });
    expect(component.find(RoleSwitcher).prop('onLogout')).toBe(onLogout);
  });

  it("shows a loader when it's loading", () => {
    component.setProps({ loading: true });
    expect(component.contains(<Shimmer height={32} />)).toBe(true);
  });

  it('leaves the account menu as the only control in the header', () => {
    component.setProps({ loading: false, onLogout: jest.fn(), user: { name: 'name' } });
    // The logo link is the one remaining anchor; log out, my account and the
    // language switcher all moved into the menu.
    expect(component.find('a')).toHaveLength(2); // skip-link + logo
    expect(component.find(RoleSwitcher)).toHaveLength(1);
  });
});
