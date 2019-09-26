import React from 'react';
import { shallow } from 'enzyme';

import { FundExchangeRow } from './FundExchangeRow';

describe('Fund exchange row', () => {
  let component;
  let sourceFunds;
  let targetFunds;

  function fakeEvent(value) {
    return { target: { value } };
  }

  beforeEach(() => {
    const translate = key => `translated:${key}`;
    component = shallow(<FundExchangeRow translations={{ translate }} />);
    sourceFunds = [
      { isin: 'source isin 1', name: 'source name 1' },
      { isin: 'source isin 3', name: 'source name 3' },
      { isin: 'source isin 2', name: 'source name 2' },
    ];
    targetFunds = [
      { isin: 'target isin 1', name: 'target name 1' },
      { isin: 'target isin 3', name: 'target name 3' },
      { isin: 'target isin 2', name: 'target name 2' },
    ];
  });

  it('can change the source fund', () => {
    const onChange = jest.fn();
    const selection = {
      sourceFundIsin: 'source isin 1',
      percentage: 1,
      targetFundIsin: 'target isin 1',
    };
    component.setProps({ onChange, selection, sourceFunds, targetFunds });
    expect(onChange).not.toHaveBeenCalled();
    component
      .find('select')
      .first()
      .simulate('change', fakeEvent('source isin 3'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      sourceFundIsin: 'source isin 3',
      percentage: 1,
      targetFundIsin: 'target isin 1',
    });
  });

  it('shows all source funds as options', () => {
    component.setProps({ sourceFunds });
    sourceFunds.forEach(fund =>
      expect(component.contains(<option value={fund.isin}>{fund.name}</option>)).toBe(true),
    );
  });

  it('shows all target funds as options', () => {
    component.setProps({ targetFunds });
    targetFunds.forEach(fund =>
      expect(component.contains(<option value={fund.isin}>{fund.name}</option>)).toBe(true),
    );
  });

  it('sorts source funds', () => {
    component.setProps({ sourceFunds });
    expect(
      component
        .find('option')
        .at(0)
        .prop('value'),
    ).toBe('source isin 1');
    expect(
      component
        .find('option')
        .at(1)
        .prop('value'),
    ).toBe('source isin 2');
    expect(
      component
        .find('option')
        .at(2)
        .prop('value'),
    ).toBe('source isin 3');
  });

  it('sorts target funds', () => {
    component.setProps({ targetFunds });
    expect(
      component
        .find('option')
        .at(0)
        .prop('value'),
    ).toBe('target isin 1');
    expect(
      component
        .find('option')
        .at(1)
        .prop('value'),
    ).toBe('target isin 2');
    expect(
      component
        .find('option')
        .at(2)
        .prop('value'),
    ).toBe('target isin 3');
  });

  it("sets the current selection's source fund as active", () => {
    const sourceFundIsin = 'source isin 2';
    const selection = {
      sourceFundIsin,
      targetFundIsin: 'target isin 3',
      percentage: 1,
    };
    component.setProps({ sourceFunds, selection });
    expect(
      component
        .find('select')
        .first()
        .prop('value'),
    ).toBe(sourceFundIsin);
  });

  it("sets the current selection's target fund as active", () => {
    const targetFundIsin = 'target isin 2';
    const selection = {
      sourceFundIsin: 'source isin 3',
      targetFundIsin,
      percentage: 1,
    };
    component.setProps({ targetFunds, selection });
    expect(
      component
        .find('select')
        .last()
        .prop('value'),
    ).toBe(targetFundIsin);
  });

  it("sets the current selection's percentage as active", () => {
    const percentage = 0.5;
    const selection = {
      sourceFundIsin: 'source isin 3',
      targetFundIsin: 'target isin 3',
      percentage,
    };
    component.setProps({ selection });
    expect(component.find('input').prop('value')).toBe('50');
  });

  it('can parse 7 percent', () => {
    const percentage = 0.07;
    const selection = {
      sourceFundIsin: 'source isin 3',
      targetFundIsin: 'target isin 3',
      percentage,
    };
    component.setProps({ selection });
    expect(component.find('input').prop('value')).toBe('7');
  });

  it('can change the percentage', () => {
    const onChange = jest.fn();
    const selection = {
      sourceFundIsin: 'source isin 1',
      percentage: 1,
      targetFundIsin: 'target isin 1',
    };
    component.setProps({ onChange, selection, sourceFunds, targetFunds });
    expect(onChange).not.toHaveBeenCalled();
    component.find('input').simulate('change', fakeEvent('80'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      sourceFundIsin: 'source isin 1',
      percentage: 0.8,
      targetFundIsin: 'target isin 1',
    });
  });

  it('clamps the changed percentage from 0 to 100', () => {
    const onChange = jest.fn();
    const selection = {
      sourceFundIsin: 'source isin 1',
      percentage: 1,
      targetFundIsin: 'target isin 1',
    };
    component.setProps({ onChange, selection, sourceFunds, targetFunds });
    expect(onChange).not.toHaveBeenCalled();
    component.find('input').simulate('change', fakeEvent('200'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      sourceFundIsin: 'source isin 1',
      percentage: 1,
      targetFundIsin: 'target isin 1',
    });
  });

  it('can change the target fund', () => {
    const onChange = jest.fn();
    const selection = {
      sourceFundIsin: 'source isin 1',
      percentage: 1,
      targetFundIsin: 'target isin 1',
    };
    component.setProps({ onChange, selection, sourceFunds, targetFunds });
    expect(onChange).not.toHaveBeenCalled();
    component
      .find('select')
      .last()
      .simulate('change', fakeEvent('target isin 3'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      sourceFundIsin: 'source isin 1',
      percentage: 1,
      targetFundIsin: 'target isin 3',
    });
  });
});
