import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import { shallow } from 'enzyme';

import { ThirdPillarSetup } from './ThirdPillarSetup';

describe('ThirdPillarSetup', () => {
  let component;
  beforeEach(() => {
    component = shallow(<ThirdPillarSetup />);
  });

  it('redirects to next path when the 3rd pillar is active', () => {
    component.setProps({ nextPath: '/next-path' });
    const redirects = () => component.contains(<Redirect to="/next-path" />);

    component.setProps({ isThirdPillarActive: false });
    expect(redirects()).toBe(false);
    component.setProps({ isThirdPillarActive: true });
    expect(redirects()).toBe(true);
  });

  it('redirects to next path on button click', () => {
    component.setProps({ nextPath: '/a-path' });
    expect(component.find(Link).prop('to')).toBe('/a-path');
  });
});
