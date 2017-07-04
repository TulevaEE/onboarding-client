import React from 'react';
import { shallow } from 'enzyme';

import { InlineSignUpForm } from './InlineSignUpForm';

describe('InlineSignUpForm', () => {
  let component;
  let props;

  beforeEach(() => {
    props = { translations: { translate: () => '' } };
    component = shallow(<InlineSignUpForm {...props} />);
  });

  it('renders component', () => {
    expect(component);
  });
});
