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

  it('passes the mobile id fields and handlers to MobileIdLoginTab', () => {
    const onPhoneNumberChange = jest.fn();
    const onPersonalCodeChange = jest.fn();
    const onMobileIdSubmit = jest.fn();
    component.setProps({
      phoneNumber: '+37255512345',
      personalCode: '38888888888',
      onPhoneNumberChange,
      onPersonalCodeChange,
      onMobileIdSubmit,
    });

    const mobileIdTab = component.find('MobileIdLoginTab');
    expect(mobileIdTab.prop('phoneNumber')).toBe('+37255512345');
    expect(mobileIdTab.prop('personalCode')).toBe('38888888888');
    expect(mobileIdTab.prop('onPhoneNumberChange')).toBe(onPhoneNumberChange);
    expect(mobileIdTab.prop('onPersonalCodeChange')).toBe(onPersonalCodeChange);
    expect(mobileIdTab.prop('onMobileIdSubmit')).toBe(onMobileIdSubmit);
  });

  it('passes the smart id start handler to SmartIdLoginTab', () => {
    const onSmartIdLoginStart = jest.fn();
    component.setProps({ onSmartIdLoginStart });

    expect(component.find('SmartIdLoginTab').prop('onSmartIdLoginStart')).toBe(onSmartIdLoginStart);
  });

  it('passes id card auth handler to IdCardLoginTab', () => {
    const onAuthenticateWithIdCard = jest.fn();
    component.setProps({ onAuthenticateWithIdCard });

    const idCardTab = component.find('IdCardLoginTab');
    expect(idCardTab.prop('onAuthenticateWithIdCardMtls')).toBe(onAuthenticateWithIdCard);
  });

  describe('when time within maintenance window', () => {
    beforeEach(() => {
      jest.setSystemTime(new Date('April 21, 2026 21:00:00'));
      component = shallow(<LoginForm {...{ translations: { translate: () => '' } }} />);
    });

    it('shows the maintenance component', () => {
      expect(component.contains(<Maintenance />)).toBe(true);
    });
  });
});
