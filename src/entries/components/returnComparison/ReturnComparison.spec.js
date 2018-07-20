import React from 'react';
import { shallow } from 'enzyme';

import ReturnComparison from '.';
import { Loader } from '../common';

describe('Return comparison', () => {
  let component;
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

  function loader() {
    return component.find(Loader);
  }

  function content() {
    return component.find('.row');
  }

  function actualPercentage() {
    return returnPercentage(0);
  }

  function estonianPercentage() {
    return returnPercentage(1);
  }

  function marketPercentage() {
    return returnPercentage(2);
  }

  function returnPercentage(index) {
    return component
      .find('.col-sm-4')
      .at(index)
      .find('.h2')
      .text();
  }
});
