import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import { ConfirmThirdPillarMandate } from './ConfirmThirdPillarMandate';

describe('ConfirmThirdPillarMandate', () => {
  let component;
  beforeEach(() => {
    component = shallow(
      <ConfirmThirdPillarMandate
        monthlyContribution={1000}
        selectedFutureContributionsFund={{ isin: 'EE123' }}
      />,
    );
  });

  it('redirects to previous path only when no monthly contribution', () => {
    component.setProps({ previousPath: '/a-path' });
    const redirects = () => component.contains(<Redirect to="/a-path" />);

    expect(redirects()).toBe(false);
    component.setProps({ monthlyContribution: null });
    expect(redirects()).toBe(true);
  });

  it('redirects to previous path only when no selected future contributions fund', () => {
    component.setProps({ previousPath: '/a-path' });
    const redirects = () => component.contains(<Redirect to="/a-path" />);

    expect(redirects()).toBe(false);
    component.setProps({ selectedFutureContributionsFund: null });
    expect(redirects()).toBe(true);
  });

  it('has future contributions fund name and message only when future contributions fund is selected', () => {
    const hasMessage = () =>
      component.contains(<Message>confirmThirdPillarMandate.contribution</Message>);
    const hasFundName = () => component.contains(<b className="highlight">A pension fund</b>);

    component.setProps({ selectedFutureContributionsFund: null });
    expect(hasMessage()).toBe(false);
    expect(hasFundName()).toBe(false);
    component.setProps({
      selectedFutureContributionsFund: { isin: 'EE123', name: 'A pension fund' },
    });
    expect(hasMessage()).toBe(true);
    expect(hasFundName()).toBe(true);
  });

  it('redirects to previous path on button click', () => {
    component.setProps({ previousPath: '/a-path' });
    expect(component.find(Link).prop('to')).toBe('/a-path');
  });
});
