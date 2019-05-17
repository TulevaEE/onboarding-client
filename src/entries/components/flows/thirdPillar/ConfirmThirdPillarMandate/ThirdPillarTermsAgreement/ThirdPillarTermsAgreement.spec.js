import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import { ThirdPillarTermsAgreement } from './ThirdPillarTermsAgreement';

describe('ThirdPillarTermsAgreement', () => {
  let component;
  beforeEach(() => {
    component = shallow(<ThirdPillarTermsAgreement />);
  });

  it('has checkbox checked only when agreed', () => {
    const checkboxChecked = () => checkbox().prop('checked');

    expect(checkboxChecked()).toBe(false);
    component.setProps({ agreed: true });
    expect(checkboxChecked()).toBe(true);
  });

  it('changes agreement on checkbox change', () => {
    const onAgreementChange = jest.fn();
    component.setProps({ onAgreementChange });

    expect(onAgreementChange).not.toBeCalled();
    checkbox().simulate('change');
    expect(onAgreementChange).toBeCalledWith(true);
    component.setProps({ agreed: true });
    checkbox().simulate('change');
    expect(onAgreementChange).toBeCalledWith(false);
  });

  it('has age-dependent recommendation confirmation only when above age threshold', () => {
    const hasConfirmation = () =>
      component.contains(
        <Message>thirdPillarAgreement.ageDependentRecommendationConfirmation</Message>,
      );

    expect(hasConfirmation()).toBe(false);
    component.setProps({ age: 55 });
    expect(hasConfirmation()).toBe(true);
  });

  it('has age-dependent recommendation only when above age threshold', () => {
    const hasConfirmation = () =>
      component.contains(<Message>thirdPillarAgreement.ageDependentRecommendation</Message>);

    expect(hasConfirmation()).toBe(false);
    component.setProps({ age: 55 });
    expect(hasConfirmation()).toBe(true);
  });

  function checkbox() {
    return component.find('#third-pillar-terms-checkbox');
  }
});
