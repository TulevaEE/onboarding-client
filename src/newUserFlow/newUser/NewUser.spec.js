import React from 'react';
import { shallow } from 'enzyme';
// import { Message } from 'retranslate';

import NewUser from './NewUser';

describe('NewUser', () => {
  let component;

  beforeEach(() => {
    component = shallow(<NewUser />);
  });

  it('renders component', () => {
    expect(component);
  });
});
