import React from 'react';
import { shallow } from 'enzyme';
import { Link } from 'react-router-dom';
import { Message } from 'retranslate';

import { logo, Loader } from '../../common';
import Header from './Header';
import LanguageSwitcher from './languageSwitcher';

describe('Header', () => {
  let component;

  beforeEach(() => {
    component = shallow(<Header />);
  });

  it('shows a header logo with a link', () => {
    expect(
      component.contains(
        <a href="//tuleva.ee" target="_blank" rel="noopener noreferrer">
          <img src={logo} alt="Tuleva" className="img-responsive brand-logo" />
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
    expect(component.text()).toContain(name);
    expect(component.contains(<Loader className="align-right" />)).toBe(false);
  });

  it('can log out the user', () => {
    const onLogout = jest.fn();
    component.setProps({ loading: false, onLogout, user: { name: 'name' } });
    expect(onLogout).not.toHaveBeenCalled();
    component.find('button').simulate('click');
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("shows a loader when it's loading", () => {
    component.setProps({ loading: true });
    expect(component.contains(<Loader className="align-right" />)).toBe(true);
  });

  it('renders my account button', () => {
    const onLogout = jest.fn();
    component.setProps({ loading: false, onLogout, user: { name: 'name' } });
    expect(
      component
        .find(Link)
        .at(0)
        .prop('to'),
    ).toBe('/account');
    expect(
      component
        .find(Link)
        .at(0)
        .children()
        .at(0)
        .getElement(0),
    ).toEqual(<Message>header.my.account</Message>);
  });

  it('renders the language switcher', () => {
    component.setProps({ loading: false, user: { name: 'name' } });
    expect(component.contains(<LanguageSwitcher />)).toBe(true);
  });
});
