import React from 'react';
import { Message } from 'retranslate';
import { shallow } from 'enzyme';

import ErrorAlert from './ErrorAlert';

describe('Error alert', () => {
  let component;

  beforeEach(() => {
    component = shallow(<ErrorAlert />);
  });

  it('displays a generic message for an unknown error', () => {
    component.setProps({ description: 'oh man something is wrong!' });
    expect(component.contains(<Message>login.error.generic</Message>)).toBe(true);
  });

  it('does not display a generic message when user has not joined tuleva', () => {
    component.setProps({ description: 'INVALID_USER_CREDENTIALS' });
    expect(component.contains(<Message>login.error.generic</Message>)).toBe(false);
  });

  it('does not display a generic message when invalid personal code was provided', () => {
    component.setProps({ description: 'ValidPersonalCode' });
    expect(component.contains(<Message>login.error.generic</Message>)).toBe(false);
  });

  it('shows a call to action with a link to join tuleva when user has not joined tuleva', () => {
    component.setProps({ description: 'INVALID_USER_CREDENTIALS' });
    expect(
      component.contains(
        <a href="//tuleva.ee/#liitu">
          <Message>login.join.tuleva</Message>
        </a>,
      ),
    ).toBe(true);
    expect(component.contains(<Message>login.error.invalid.user.credentials</Message>)).toBe(true);
  });

  it('shows id card login start failed error message', () => {
    component.setProps({ description: 'ID_CARD_LOGIN_START_FAILED' });
    expect(component.contains(<Message>login.id.card.start.failed</Message>)).toBe(true);
  });
});
