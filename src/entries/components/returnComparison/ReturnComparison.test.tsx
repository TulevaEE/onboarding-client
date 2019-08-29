import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';

import ReturnComparison from '.';
import { Loader } from '../common';

describe('Return comparison', () => {
  let component: ShallowWrapper;
  beforeEach(() => {
    component = shallow(<ReturnComparison personal={0.012345} index={0.03456789} />);
  });

  it('shows loader when loading', () => {
    expect(loader().exists()).toBe(false);
    component.setProps({ loading: true });
    expect(loader().exists()).toBe(true);
  });

  it('does not show content when loading', () => {
    expect(content().exists()).toBe(true);
    component.setProps({ loading: true });
    expect(content().exists()).toBe(false);
  });

  it('has formatted percentages for existing and - for not existing returns', () => {
    expect(personal()).toBe('1.2%');
    expect(pensionFund()).toBe('-');
    expect(index()).toBe('3.5%');
  });

  const loader = (): ShallowWrapper<any> => component.find(Loader);
  const content = (): ShallowWrapper<any> => component.find('.row');
  const personal = (): string => returnValue(0);
  const pensionFund = (): string => returnValue(1);
  const index = (): string => returnValue(2);
  const returnValue = (i: number): string =>
    component
      .find('.col-sm-4')
      .at(i)
      .find('.h2')
      .text();
});
