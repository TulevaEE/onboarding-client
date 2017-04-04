import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import ErrorMessage from './ErrorMessage';

describe('Error message', () => {
  let component;
  let props;
  const errors = { errors: [{ code: 'some.code' }, { code: 'some.other.code' }] };

  beforeEach(() => {
    component = shallow(<ErrorMessage {...props} />);
    component.setProps({ errors });
  });

  it('shows intro text', () => {
    expect(component.contains(<Message>error.messages.intro</Message>)).toBe(true);
  });

  it('shows an error messages', () => {
    const errors = { errors: [{ code: 'some.code' }, { code: 'some.other.code' }] };

    errors.errors.forEach((error, index) => {
      expect(component.contains(error.code.toString())).toBe(true);
    });    
  });

  it('shows close button', () => {
    expect(component.contains(<Message>error.message.close</Message>)).toBe(true);
  });

  it('renders as a modal when it is overlayed', () => {
    const isComponentModal = () => component.at(0).hasClass('tv-modal');
    expect(isComponentModal()).toBe(false);
    component.setProps({ overlayed: true });
    expect(isComponentModal()).toBe(true);
  });  
  
});
