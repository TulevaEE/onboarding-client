import React from 'react';
import { shallow } from 'enzyme';
import config from 'react-global-configuration';
import { FormattedMessage } from 'react-intl';

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

  it("shows the user's name in the account menu", () => {
    const name = 'A name of a person';
    component.setProps({
      user: { name },
    });
    expect(component.find(RoleSwitcher).prop('userName')).toBe(name);
    expect(component.contains(<Shimmer height={32} />)).toBe(false);
  });

  it('hands logging out to the account menu', () => {
    const onLogout = jest.fn();
    component.setProps({ onLogout, user: { name: 'name' } });
    expect(component.find(RoleSwitcher).prop('onLogout')).toBe(onLogout);
  });

  it("shows a loader until the user's name is known", () => {
    component.setProps({ user: { name: '' } });
    expect(component.contains(<Shimmer height={32} />)).toBe(true);
    expect(component.find(RoleSwitcher)).toHaveLength(0);
  });

  it('names the hackathon next to the logo on the hackathon pages', () => {
    expect(component.find('.hackathon-brand-sub').exists()).toBe(false);

    component.setProps({ hackathon: true });

    const label = component.find('.hackathon-brand-sub');
    expect(label.prop('href')).toBe('/hackathon');
    expect(label.contains(<FormattedMessage id="hackathon.label" />)).toBe(true);
  });

  it('leaves the account menu as the only control in the header', () => {
    component.setProps({ onLogout: jest.fn(), user: { name: 'name' } });
    expect(component.find('a')).toHaveLength(2); // skip-link + logo
    expect(component.find(RoleSwitcher)).toHaveLength(1);
  });
});
