import React from 'react';
import { shallow } from 'enzyme';

import { FormattedMessage } from 'react-intl';
import ErrorAlert from './ErrorAlert';

describe('Error alert', () => {
  let component;

  beforeEach(() => {
    component = shallow(<ErrorAlert />);
  });

  it('displays a generic message for an unknown error', () => {
    component.setProps({ description: 'oh man something is wrong!' });
    expect(component.contains(<FormattedMessage id="login.error.generic" />)).toBe(true);
  });

  it('does not display a generic message when user has not joined tuleva', () => {
    component.setProps({ description: 'INVALID_USER_CREDENTIALS' });
    expect(component.contains(<FormattedMessage id="login.error.generic" />)).toBe(false);
  });

  it('does not display a generic message when invalid personal code was provided', () => {
    component.setProps({ description: 'ValidPersonalCode' });
    expect(component.contains(<FormattedMessage id="login.error.generic" />)).toBe(false);
  });

  it('shows a call to action with a link to join tuleva when user has not joined tuleva', () => {
    component.setProps({ description: 'INVALID_USER_CREDENTIALS' });
    expect(
      component.contains(
        <a href="//tuleva.ee/#liitu">
          <FormattedMessage id="login.join.tuleva" />
        </a>,
      ),
    ).toBe(true);
    expect(component.contains(<FormattedMessage id="login.error.invalid.user.credentials" />)).toBe(
      true,
    );
  });

  it('shows id card login start failed error message', () => {
    component.setProps({ description: 'ID_CARD_LOGIN_START_FAILED' });
    expect(component.contains(<FormattedMessage id="login.id.card.start.failed" />)).toBe(true);
  });
});
