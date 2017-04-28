import React from 'react';
import { shallow } from 'enzyme';
// import { Message } from 'retranslate';

import NonMember from './NonMember';

describe('NonMember', () => {
  let component;

  beforeEach(() => {
    component = shallow(<NonMember />);
  });

  it('renders component', () => {
    expect(component);
  });
});
