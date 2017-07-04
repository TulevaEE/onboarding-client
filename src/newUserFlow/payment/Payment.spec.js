import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import { Payment } from './Payment';
import config from 'react-global-configuration';

describe('Payment', () => {
  let component;
  const newUserPaymentRedirectBaseUrl = 'https://payment-test.maksekeskus.ee/pay/1/link.html?shopId=322a5e5e-37ee-45b1-8961-ebd00e84e209&amount=100';

  beforeEach(() => {
    config.get = () => newUserPaymentRedirectBaseUrl;
    component = shallow(<Payment />);
  });

  it('renders component', () => {
    expect(component);
  });

  it('renders the correct payment link with the correct reference', () => {
    const userId = '123';
    component.setProps({ userId });

    expect(component.contains(<a
      href={`${newUserPaymentRedirectBaseUrl}&reference=${userId}`}
      className="btn btn-primary"
    ><Message>new.user.flow.payment.bank.links</Message></a>)).toBe(true);
  });
});
