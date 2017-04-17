import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import PensionFundTable from '../../onboardingFlow/selectSources/pensionFundTable';
import { Loader } from '../../common';
import NewUser from './NewUser';

describe('NewUser', () => {
  let component;

  beforeEach(() => {
    component = shallow(<NewUser />);
  });

  it('renders component', () => {
    expect(component);
  });

  it('renders a loader when loading source or target funds', () => {
    component.setProps({ loadingSourceFunds: true });
    expect(component.get(0)).toEqual(<Loader className="align-middle" />);
    component.setProps({ loadingSourceFunds: false, loadingTargetFunds: true });
    expect(component.get(0)).toEqual(<Loader className="align-middle" />);
  });

  it('does not render a loader when funds loaded', () => {
    component.setProps({ loadingSourceFunds: false, loadingTargetFunds: false });
    expect(component.get(0)).not.toEqual(<Loader className="align-middle" />);
  });

  it('renders a title', () => {
    expect(component.contains(<Message>select.sources.current.status</Message>)).toBe(true);
  });

  it('renders a pension fund table with given funds', () => {
    const sourceFunds = [{ iAmAFund: true }, { iAmAlsoAFund: true }];
    component.setProps({ sourceFunds });
    expect(component.contains(<PensionFundTable funds={sourceFunds} />)).toBe(true);
  });


});
