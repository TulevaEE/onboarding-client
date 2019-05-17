import React from 'react';
import { shallow } from 'enzyme';
import { Redirect } from 'react-router-dom';

import { ThirdPillarPayment } from './ThirdPillarPayment';

describe('ThirdPillarPayment', () => {
  let component;
  beforeEach(() => {
    component = shallow(<ThirdPillarPayment />);
  });

  it('redirects to previous path only when no signed mandate id', () => {
    component.setProps({ previousPath: '/previous-path' });
    const redirects = () => component.contains(<Redirect to="/previous-path" />);

    expect(redirects()).toBe(true);
    component.setProps({ signedMandateId: 123 });
    expect(redirects()).toBe(false);
  });

  it('redirects to previous path only when no signed mandate id', () => {
    const monthlyContribution = () => component.find('[data-test-id="monthly-contribution"]');

    component.setProps({ monthlyContribution: 1000 });
    expect(monthlyContribution().text()).toBe('1000 EUR');
  });
});
