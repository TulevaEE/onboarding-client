import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import ErrorMessage from './ErrorMessage';

describe('Error message', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {};
    component = shallow(<ErrorMessage {...props} />);
  });

  it('shows an error message', () => {
    const errors = [{1:2}];
    component.setProps({ errors });
    expect(component.text()).toContain(errors);
    expect(component.contains(errors.toString())).toBe(true);
  });  
  
});
