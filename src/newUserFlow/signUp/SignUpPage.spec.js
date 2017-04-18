import React from 'react';
import { shallow } from 'enzyme';
// import { Message } from 'retranslate';

import { SignUpPage } from './SignUpPage';

describe('SignUpPage', () => {
  let component;

  beforeEach(() => {
    component = shallow(<SignUpPage />);
  });

  it('renders component', () => {
    expect(component);
  });
});
