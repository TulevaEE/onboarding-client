import React from 'react';
import { shallow } from 'enzyme';
import { Link } from 'react-router';
import { Message } from 'retranslate';

import { AuthenticationLoader } from '../../common';
import { NewUser } from './NewUser';
import OldPensionFundList from './oldPensionFundList';
import BringPensionToTulevaList from './bringPensionToTulevaList';
import JoinTulevaList from './joinTulevaList';
import CalculatorFootnotes from '../../common/comparisonFootnotes';

describe('New user step', () => {
  let component;

  beforeEach(() => {
    const props = { loading: false, activeSourceFund: { managementFeePercent: '0.05' } };
    component = shallow(<NewUser {...props} />);
  });

  xit('renders a loader when loading source funds', () => {
    component.setProps({ loadingSourceFunds: true });
    expect(component.get(0)).toEqual(<AuthenticationLoader />);
  });

  xit('does not render a loader when funds loaded', () => {
    component.setProps({ loadingSourceFunds: false });
    expect(component.get(0)).not.toEqual(<AuthenticationLoader />);
  });

  it('renders a link to join as a member', () => {
    expect(component.find(Link).at(1).prop('to')).toBe('/steps/signup');
    expect(component.find(Link).at(1).children().at(0).node)
      .toEqual(<Message>newUserFlow.newUser.i.wish.to.join</Message>);
  });

  it('renders a link to just transfers funds, only if user is not converted', () => {
    component.setProps({ userConverted: false });
    expect(component.find(Link).at(0).prop('to')).toBe('/steps/non-member');
    expect(component.find(Link).at(0).children().at(0).node)
      .toEqual(<Message>newUserFlow.newUser.i.want.just.to.transfer.my.pension</Message>);

    component.setProps({ userConverted: true });
    expect(component.find(Link).at(0).prop('to')).not.toBe('/steps/non-member');
  });

  it('renders 3 lists', () => {
    expect(component.find(OldPensionFundList).length).toBe(1);
    expect(component.find(BringPensionToTulevaList).length).toBe(1);
    expect(component.find(JoinTulevaList).length).toBe(1);
  });

  it('renders calculator footnotes', () => {
    expect(component.contains(
      <CalculatorFootnotes />,
    )).toBe(true);
  });
});
