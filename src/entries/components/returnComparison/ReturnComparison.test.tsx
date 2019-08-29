import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';

import ReturnComparison from '.';
import { Loader } from '../common';

describe('Return comparison', () => {
  let component: ShallowWrapper;
  beforeEach(() => {
    component = shallow(
      <ReturnComparison actualPercentage={0.012345} marketPercentage={0.03456789} />,
    );
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
    expect(actualPercentage()).toBe('1.2%');
    expect(estonianPercentage()).toBe('-');
    expect(marketPercentage()).toBe('3.5%');
  });

  const loader = (): ShallowWrapper<any> => component.find(Loader);
  const content = (): ShallowWrapper<any> => component.find('.row');
  const actualPercentage = (): string => returnPercentage(0);
  const estonianPercentage = (): string => returnPercentage(1);
  const marketPercentage = (): string => returnPercentage(2);
  const returnPercentage = (index: number): string =>
    component
      .find('.col-sm-4')
      .at(index)
      .find('.h2')
      .text();
});
