import React from 'react';
import { shallow } from 'enzyme';

import { Loader } from '../../common';
import Header from './Header';

describe('Header', () => {
  let component;

  beforeEach(() => {
    component = shallow(<Header />);
  });

  it('shows the user\'s name and id code when not loading', () => {
    const name = 'A name of a person';
    const personalCode = 'The id code a of a person';
    component.setProps({
      user: { name, personalCode },
      loading: false,
    });
    expect(component.text()).toContain(name);
    expect(component.text()).toContain(personalCode);
    expect(component.contains(<Loader className="align-right" />)).toBe(false);
  });

  it('can log out the user', () => {
    const onLogout = jest.fn();
    component.setProps({ loading: false, onLogout });
    expect(onLogout).not.toHaveBeenCalled();
    component.find('button').simulate('click');
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('shows a loader when it\'s loading', () => {
    component.setProps({ loading: true });
    expect(component.contains(<Loader className="align-right" />)).toBe(true);
  });
});
