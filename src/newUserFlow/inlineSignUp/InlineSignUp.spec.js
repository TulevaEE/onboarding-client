import React from 'react';
import { shallow } from 'enzyme';
// import { Message } from 'retranslate';

import { InlineSignUp } from './InlineSignUp';

describe('InlineSignUp', () => {
  let component;

  beforeEach(() => {
    component = shallow(<InlineSignUp />);
  });

  it('renders component', () => {
    expect(component);
  });
});
