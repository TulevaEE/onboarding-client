import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import { Payment } from './Payment';
import config from 'react-global-configuration';

describe('Payment', () => {
  let component;
  const newUserPaymentRedirectBaseUrl = 'https://payment.maksekeskus.ee/pay/1/link.html';

  beforeEach(() => {
    config.get = () => { return newUserPaymentRedirectBaseUrl;}
    component = shallow(<Payment />);
  });

  it('renders component', () => {
    expect(component);
  });

  it('renders the correct payment link with the correct reference', () => {
    component.setProps({ userId: 'test123' });

    expect(component.contains(<a
      href={ newUserPaymentRedirectBaseUrl + "?shopId=8c1a6c0a-2467-4166-ab47-006ddbf38b06&amount=100&reference=test123&return_url=https://onboarding-service.tuleva.ee/notifications/payments&return_method=POST&cancel_url=https://pension.tuleva.ee/steps/payment&cancel_method=GET&notification_url=https://onboarding-service.tuleva.ee/notifications/payments&notification_method=POST"}
      className="btn btn-primary"
    ><Message>new.user.flow.payment.bank.links</Message></a>)).toBe(true);
  });
});
