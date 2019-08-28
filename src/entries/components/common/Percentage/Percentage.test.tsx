import React from 'react';
import { shallow } from 'enzyme';

import Percentage from '.';

describe('Percentage', () => {
  it('formats value as percentage string', () => {
    const value = 0.00445;
    const string = shallow(<Percentage value={value} />).text();

    expect(string).toBe('0.45%');
  });
});
