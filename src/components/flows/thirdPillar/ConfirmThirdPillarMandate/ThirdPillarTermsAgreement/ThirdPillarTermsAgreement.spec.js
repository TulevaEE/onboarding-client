import React from 'react';
import { shallow } from 'enzyme';
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

  const checkbox = () => component.find('#third-pillar-terms-checkbox');
});
