import React from 'react';
import { Link } from 'react-router-dom';
import { shallow } from 'enzyme';

import { ThirdPillarSetup } from './ThirdPillarSetup';

describe('ThirdPillarSetup', () => {
  let component;
  beforeEach(() => {
    component = shallow(<ThirdPillarSetup />);
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

  it('has exchange existing units checkbox when more than one exchangeable source fund', () => {
    const hasCheckbox = () => exchangeExistingUnitsCheckbox().exists();

    expect(hasCheckbox()).toBe(false);
    component.setProps({ exchangeableSourceFunds: [{ isin: 'EE123' }] });
    expect(hasCheckbox()).toBe(true);
  });

  it('sets exchange existing units checkbox value based on passed prop', () => {
    component.setProps({ exchangeableSourceFunds: [{ isin: 'EE123' }] });

    const checked = () => exchangeExistingUnitsCheckbox().prop('checked');

    expect(checked()).toBe(false);
    component.setProps({ exchangeExistingUnits: true });
    expect(checked()).toBe(true);
  });

  it('calls change handler on exchange existing units change', () => {
    component.setProps({ exchangeableSourceFunds: [{ isin: 'EE123' }] });

    const onExchangeExistingUnitsChange = jest.fn();
    component.setProps({ onExchangeExistingUnitsChange });

    expect(onExchangeExistingUnitsChange).not.toBeCalled();
    exchangeExistingUnitsCheckbox().simulate('change');
    expect(onExchangeExistingUnitsChange).toBeCalledWith(true);
    component.setProps({ exchangeExistingUnits: true });
    exchangeExistingUnitsCheckbox().simulate('change');
    expect(onExchangeExistingUnitsChange).toBeCalledWith(false);
  });

  it('disables button when no monthly contribution', () => {
    const buttonIsDisabled = () => component.find('button').prop('disabled');

    expect(buttonIsDisabled()).toBe(true);
    component.setProps({ monthlyContribution: 1 });
    expect(buttonIsDisabled()).toBe(false);
  });

  it('redirects to next path on button click', () => {
    component.setProps({ nextPath: '/a-path' });
    expect(component.find(Link).prop('to')).toBe('/a-path');
  });

  const contributionInput = () => component.find('#monthly-contribution');
  const exchangeExistingUnitsCheckbox = () => component.find('#exchange-existing-units-checkbox');
});
