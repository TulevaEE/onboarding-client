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

  it('explains a Smart-ID login the user cancelled in the app', () => {
    component.setProps({ description: 'smart.id.user.refused' });
    expect(component.contains(<FormattedMessage id="login.error.smart.id.user.refused" />)).toBe(
      true,
    );
  });

  it('explains a Mobile-ID login that timed out', () => {
    component.setProps({ description: 'mobile.id.timeout' });
    expect(component.contains(<FormattedMessage id="login.error.mobile.id.timeout" />)).toBe(true);
  });

  it('explains an ID-card type that may not log in', () => {
    component.setProps({ description: 'id.card.document.type.not.allowed' });
    expect(
      component.contains(<FormattedMessage id="login.error.id.card.document.type.not.allowed" />),
    ).toBe(true);
  });

  it.each([
    ['smart.id.wrong.verification.code', 'login.error.smart.id.wrong.verification.code'],
    ['smart.id.certificate.revoked', 'login.error.smart.id.certificate.revoked'],
    ['smart.id.account.unusable', 'login.error.smart.id.account.unusable'],
    ['auth.too.many.requests', 'login.error.auth.too.many.requests'],
    ['mobile.id.phone.number.invalid', 'login.error.mobile.id.phone.number.invalid'],
  ])('explains the backend error %s', (code, messageId) => {
    component.setProps({ description: code });
    expect(component.contains(<FormattedMessage id={messageId} />)).toBe(true);
  });

  it('shows id card login start failed error message', () => {
    component.setProps({ description: 'ID_CARD_LOGIN_START_FAILED' });
    expect(component.contains(<FormattedMessage id="login.id.card.start.failed" />)).toBe(true);
  });
});
