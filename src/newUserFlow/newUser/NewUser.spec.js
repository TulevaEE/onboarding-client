import React from 'react';
import { shallow } from 'enzyme';
import { Link } from 'react-router';
import { Message } from 'retranslate';

import { Loader } from '../../common';
import { NewUser } from './NewUser';
import ComparisonWidget from '../../common/comparison/widget';

describe('New user step', () => {
  let component;

  beforeEach(() => {
    component = shallow(<NewUser />);
  });

  it('renders a loader when loading source funds', () => {
    component.setProps({ loadingSourceFunds: true });
    expect(component.get(0)).toEqual(<Loader className="align-middle" />);
  });

  it('does not render a loader when funds loaded', () => {
    component.setProps({ loadingSourceFunds: false });
    expect(component.get(0)).not.toEqual(<Loader className="align-middle" />);
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
});
