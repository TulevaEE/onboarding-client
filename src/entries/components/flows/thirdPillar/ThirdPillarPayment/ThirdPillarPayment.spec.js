import React from 'react';
import { shallow } from 'enzyme';
import { Link, Redirect } from 'react-router-dom';

import { Message } from 'retranslate';
import { ThirdPillarPayment } from './ThirdPillarPayment';

describe('ThirdPillarPayment', () => {
  let component;
  beforeEach(() => {
    component = shallow(<ThirdPillarPayment />);
  });

  it('redirects to previous path only when no signed mandate id', () => {
    component.setProps({ previousPath: '/previous-path' });
    const redirects = () => component.contains(<Redirect to="/previous-path" />);

    expect(redirects()).toBe(true);
    component.setProps({ signedMandateId: 123 });
    expect(redirects()).toBe(false);
  });

  it('has pension account number', () => {
    const pensionAccountNumber = () => component.find('[data-test-id="pension-account-number"]');

    component.setProps({ pensionAccountNumber: '987' });
    expect(pensionAccountNumber().text()).toBe('987');
  });

  it('links to next path', () => {
    component.setProps({ nextPath: '/next-path' });
    expect(
      component.contains(
        <Link to="/next-path">
          <button type="button" className="btn btn-primary mt-4">
            <Message>thirdPillarPayment.paymentButton</Message>
          </button>
        </Link>,
      ),
    ).toBe(true);
  });
});
