import React from 'react';
import { shallow } from 'enzyme';
import { Redirect } from 'react-router-dom';

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

  it('has monthly contribution', () => {
    const value = () => contributionInput().prop('value');

    expect(value()).toBe('');
    component.setProps({ monthlyContribution: 1 });
    expect(value()).toBe(1);
  });

  it('calls change handler on monthly contribution change', () => {
    const onMonthlyContributionChange = jest.fn();
    component.setProps({ onMonthlyContributionChange });

    expect(onMonthlyContributionChange).not.toBeCalled();
    contributionInput().simulate('change', { target: { value: '1' } });
    expect(onMonthlyContributionChange).toBeCalledWith(1);
  });

  it('disables buttons when no monthly contribution', () => {
    const firstButtonIsDisabled = () =>
      component
        .find('button')
        .first()
        .prop('disabled');

    const secondButtonIsDisabled = () =>
      component
        .find('button')
        .last()
        .prop('disabled');

    expect(firstButtonIsDisabled()).toBe(true);
    expect(secondButtonIsDisabled()).toBe(true);
    component.setProps({ monthlyContribution: 1 });
    expect(firstButtonIsDisabled()).toBe(false);
    expect(secondButtonIsDisabled()).toBe(false);
  });

  it('posts third pillar statistics on button clicks', () => {
    const onSubmit = jest.fn();
    const signedMandateId = 654;
    const monthlyContribution = 100;

    component.setProps({
      signedMandateId,
      monthlyContribution,
      onSubmit,
    });

    singlePaymentButton().simulate('click');
    expect(onSubmit).toBeCalledWith({
      mandateId: signedMandateId,
      singlePayment: monthlyContribution,
    });

    recurringPaymentButton().simulate('click');
    expect(onSubmit).toBeCalledWith({
      mandateId: signedMandateId,
      recurringPayment: monthlyContribution,
    });
  });

  const contributionInput = () => component.find('#monthly-contribution');
  const recurringPaymentButton = () => component.find('button').at(0);
  const singlePaymentButton = () => component.find('button').at(1);
});
