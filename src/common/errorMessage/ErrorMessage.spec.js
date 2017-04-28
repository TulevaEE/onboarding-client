import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import ErrorMessage, { getGlobalErrorCode } from './ErrorMessage';

describe('Error message', () => {
  let component;
  let props;
  let errors = { errors: [{ code: 'some.code' }, { code: 'some.other.code' }] };

  beforeEach(() => {
    component = shallow(<ErrorMessage {...props} />);
    component.setProps({ errors });
  });

  it('shows intro text', () => {
    expect(component.contains(<Message>error.messages.intro</Message>)).toBe(true);
  });

  it('shows an error messages', () => {
    errors = { errors: [{ code: 'some.code' }, { code: 'some.other.code' }] };

    errors.errors.forEach((error) => {
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

  it('returns global error message', () => {
    errors = { errors: [{ code: 'some.code', path: 'somePath' }, { code: 'global.error.code' }] };
    expect(getGlobalErrorCode(errors)).toBe('global.error.code');
  });

  it('global error message retrieval works with no errors', () => {
    errors = { errors: [] };
    expect(getGlobalErrorCode(errors)).toBe(undefined);
  });

  it('global error message retrieval works with empty object', () => {
    expect(getGlobalErrorCode({})).toBe(undefined);
  });

  it('global error message retrieval works with undefined', () => {
    expect(getGlobalErrorCode(undefined)).toBe(undefined);
  });
});
