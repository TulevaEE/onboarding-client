import React from 'react';
import { shallow } from 'enzyme';

import Percentage from '.';

describe('Percentage', () => {
  it('formats value as percentage string', () => {
    const value = 0.00445;
    const string = shallow(<Percentage value={value} />).text();

    expect(string).toBe('0.45%');
  });

  it('always shows 2 fraction digits', () => {
    const value = Number('0.00400');
    const string = shallow(<Percentage value={value} />).text();

    expect(string).toBe('0.40%');
  });

  it('strips trailing zeros', () => {
    const value = Number('0.00400');
    const string = shallow(<Percentage value={value} stripTrailingZeros />).text();

    expect(string).toBe('0.4%');
  });
});
