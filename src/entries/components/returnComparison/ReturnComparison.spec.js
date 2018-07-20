import React from 'react';
import { shallow } from 'enzyme';

import ReturnComparison from '.';

describe('Return comparison', () => {
  let component;
  beforeEach(() => {
    component = shallow(
      <ReturnComparison actualPercentage={0.012345} marketPercentage={0.03456789} />,
    );
  });

  it('has formatted percentages for existing and - for not existing returns', () => {
    expect(actualPercentage()).toBe('1.2%');
    expect(estonianPercentage()).toBe('-');
    expect(marketPercentage()).toBe('3.5%');
  });

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
