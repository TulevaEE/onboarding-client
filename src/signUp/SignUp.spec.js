import React from 'react';
import { shallow } from 'enzyme';
// import { Message } from 'retranslate';

import SignUp from './SignUp';

describe('SignUp', () => {
  let component;

  beforeEach(() => {
    component = shallow(<SignUp />);
  });

  it('renders component', () => {
    expect(component);
  });
});
