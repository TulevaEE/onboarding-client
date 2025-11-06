import React from 'react';
import { shallow } from 'enzyme';

import { FormattedMessage } from 'react-intl';
import { LoginForm } from './LoginForm';
import { Maintenance } from '../Maintenance';

describe('Login form', () => {
  let component;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('August 10, 2021 10:36:00'));

    component = shallow(<LoginForm />);
  });

  it('shows only the default title when no monthly contribution', () => {
    const componentHas = (key) => component.contains(<FormattedMessage id={key} />);

    expect(componentHas('login.title')).toBe(true);
    expect(
      componentHas('login.title.thirdPillar.withExchange', {
        monthlyContribution: 500,
      }),
    ).toBe(false);
    expect(
      componentHas('login.title.thirdPillar.withoutExchange', {
        monthlyContribution: 500,
      }),
    ).toBe(false);
    expect(componentHas('login.subtitle.thirdPillar')).toBe(false);
  });

  it('shows the third pillar with exchange title and with subtitle when monthly contribution exists and exchange is requested', () => {
    component.setProps({
      monthlyThirdPillarContribution: 500,
      exchangeExistingThirdPillarUnits: true,
    });

    const componentHas = (key, params) =>
      component.contains(<FormattedMessage id={key} values={params} />);

    expect(componentHas('login.title')).toBe(false);
    expect(
      componentHas('login.title.thirdPillar.withExchange', {
        monthlyContribution: 500,
      }),
    ).toBe(true);
    expect(
      componentHas('login.title.thirdPillar.withoutExchange', {
        monthlyContribution: 500,
      }),
    ).toBe(false);
    expect(componentHas('login.subtitle.thirdPillar')).toBe(true);
  });

  it('shows the third pillar with no exchange title and with subtitle when monthly contribution exists and no exchange is requested', () => {
    component.setProps({ monthlyThirdPillarContribution: 500 });

    const componentHas = (key, params) =>
      component.contains(<FormattedMessage id={key} values={params} />);

    expect(componentHas('login.title')).toBe(false);
    expect(
      componentHas('login.title.thirdPillar.withExchange', {
        monthlyContribution: 500,
      }),
    ).toBe(false);
    expect(
      componentHas('login.title.thirdPillar.withoutExchange', {
        monthlyContribution: 500,
      }),
    ).toBe(true);
    expect(componentHas('login.subtitle.thirdPillar')).toBe(true);
  });

  it('changes value of phone number when typed into input', () => {
    const onPhoneNumberChange = jest.fn();
    const value = 'text';
    component.setProps({ onPhoneNumberChange });

    expect(onPhoneNumberChange).not.toHaveBeenCalled();
    component.find('input#mobile-id-number').simulate('change', { target: { value } });
    expect(onPhoneNumberChange).toHaveBeenCalledTimes(1);
    expect(onPhoneNumberChange).toHaveBeenCalledWith(value);
  });

  it('sets phone number submit button to disabled when no phone number present', () => {
    const submitButtonDisabled = () => !!component.find('input#mobile-id-submit').prop('disabled');
    expect(submitButtonDisabled()).toBe(true);
    component.setProps({ personalCode: 'number' });
    expect(submitButtonDisabled()).toBe(true);
  });

  it('sets phone number submit button to disabled when no identity code is present', () => {
    const submitButtonDisabled = () => !!component.find('input#mobile-id-submit').prop('disabled');
    expect(submitButtonDisabled()).toBe(true);
    component.setProps({ phoneNumber: 'number' });
    expect(submitButtonDisabled()).toBe(true);
  });

  it('sets phone number submit button to enabled when both identity code and phone number are present', () => {
    const submitButtonDisabled = () => !!component.find('input#mobile-id-submit').prop('disabled');
    expect(submitButtonDisabled()).toBe(true);
    component.setProps({ personalCode: 'number' });
    component.setProps({ phoneNumber: 'number' });
    expect(submitButtonDisabled()).toBe(false);
  });

  it('can submit a phone number and identity code', () => {
    const phoneNumber = 'number';
    const personalCode = 'number';
    const onMobileIdSubmit = jest.fn();
    component.setProps({ phoneNumber, personalCode, onMobileIdSubmit });

    expect(onMobileIdSubmit).not.toHaveBeenCalled();
    component
      .find('form')
      .last()
      .simulate('submit', { preventDefault: () => true });
    expect(onMobileIdSubmit).toHaveBeenCalledTimes(1);
    expect(onMobileIdSubmit).toHaveBeenCalledWith(phoneNumber, personalCode);
  });

  it('can submit identity code', () => {
    const personalCode = 'number';
    const onIdCodeSubmit = jest.fn();
    component.setProps({ personalCode, onIdCodeSubmit });

    expect(onIdCodeSubmit).not.toHaveBeenCalled();
    component
      .find('form')
      .first()
      .simulate('submit', { preventDefault: () => true });
    expect(onIdCodeSubmit).toHaveBeenCalledTimes(1);
    expect(onIdCodeSubmit).toHaveBeenCalledWith(personalCode);
  });

  it('can log in with id card', () => {
    const onAuthenticateWithIdCard = jest.fn();
    component.setProps({ onAuthenticateWithIdCard });

    expect(onAuthenticateWithIdCard).not.toHaveBeenCalled();
    component.find('button').simulate('click');
    expect(onAuthenticateWithIdCard).toHaveBeenCalledTimes(1);
  });

  describe('when time within maintenance window', () => {
    beforeEach(() => {
      jest.setSystemTime(new Date('November 6, 2025 14:30:00'));
      component = shallow(<LoginForm {...{ translations: { translate: () => '' } }} />);
    });

    it('shows the maintenance component', () => {
      expect(component.contains(<Maintenance />)).toBe(true);
    });
  });
});
