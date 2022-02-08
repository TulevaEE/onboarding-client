import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import { FormattedMessage } from 'react-intl';
import ErrorMessage, { getGlobalErrorCode } from './ErrorMessage';

describe('Error message', () => {
  let component;
  let props;
  let errors = {
    errors: [
      { code: 'some.code', message: 'some message' },
      { code: 'some.other.code', message: 'some other message' },
    ],
  };

  beforeEach(() => {
    component = shallow(<ErrorMessage {...props} />);
    component.setProps({ errors });
  });

  it('shows intro text', () => {
    expect(component.contains(<FormattedMessage id="error.messages.intro" />)).toBe(true);
  });

  it('shows error codes and messages', () => {
    errors.errors.forEach((error) => {
      expect(component.contains(<FormattedMessage id={error.code} />)).toBe(true);
      expect(component.contains(error.message)).toBe(true);
    });
  });

  it('shows close button when onCancel is set', () => {
    expect(component.contains(<FormattedMessage id="error.message.close" />)).not.toBe(true);
    component.setProps({ onCancel: jest.fn() });
    expect(component.contains(<FormattedMessage id="error.message.close" />)).toBe(true);
  });

  it('renders as a modal when it is overlayed', () => {
    const isComponentModal = () => component.at(0).hasClass('tv-modal');
    expect(isComponentModal()).toBe(false);
    component.setProps({ overlayed: true });
    expect(isComponentModal()).toBe(true);
  });

  it('returns global error message', () => {
    errors = {
      errors: [{ code: 'some.code', path: 'somePath' }, { code: 'global.error.code' }],
    };
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
