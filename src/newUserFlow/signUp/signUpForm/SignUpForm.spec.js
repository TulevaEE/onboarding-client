import React from 'react';
import { shallow } from 'enzyme';

import { SignUpForm } from './SignUpForm';

describe('SignUpForm', () => {
  let component;
  let props;

  beforeEach(() => {
    props = { translations: { translate: () => '' } };
    component = shallow(<SignUpForm {...props} />);
  });

  it('renders component', () => {
    expect(component);
  });
});
