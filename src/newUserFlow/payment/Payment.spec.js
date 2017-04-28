import React from 'react';
import { shallow } from 'enzyme';
// import { Message } from 'retranslate';

import { Payment } from './Payment';

describe('Payment', () => {
  let component;

  beforeEach(() => {
    component = shallow(<Payment />);
  });

  it('renders component', () => {
    expect(component);
  });
});
