import React from 'react';
import { shallow } from 'enzyme';
// import { Message } from 'retranslate';

import { InlineSignUpPage } from './InlineSignUpPage';

describe('InlineSignUpPage', () => {
  let component;

  beforeEach(() => {
    component = shallow(<InlineSignUpPage />);
  });

  it('renders component', () => {
    expect(component);
  });
});
