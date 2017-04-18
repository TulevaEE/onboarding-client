import React from 'react';
import { shallow } from 'enzyme';

import SignUpForm from './SignUpForm';

describe('SignUpForm', () => {
  let props;
  let component;

  beforeEach(() => {
    props = {};
    component = shallow(<SignUpForm {...props} />);
  });

  it('renders component', () => {
    expect(component);
  });
});
