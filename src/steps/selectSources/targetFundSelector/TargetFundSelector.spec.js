import React from 'react';
import { Message } from 'retranslate';
import { shallow } from 'enzyme';

import TargetFundSelector from './TargetFundSelector';

describe('Target fund selector', () => {
  let component;

  beforeEach(() => {
    component = shallow(<TargetFundSelector />);
  });

  it('renders a target fund selector button for every target fund', () => {
    const targetFunds = [
      { isin: '123' },
      { isin: '456' },
      { isin: '789' },
    ];
    component.setProps({ targetFunds });
    expect(component.find('button').length).toBe(3);
    targetFunds.forEach(({ isin }) => {
      expect(component.contains(<Message>{`target.funds.${isin}.title`}</Message>)).toBe(true);
      expect(component.contains(<Message>{`target.funds.${isin}.description`}</Message>)).toBe(true);
      // TODO: add test for terms link once we have the links.
    });
  });

  it('sets the active target fund as active', () => {
    const selectedTargetFundIsin = '456';
    const targetFunds = [
      { isin: '123' },
      { isin: '456' },
      { isin: '789' },
    ];
    component.setProps({ targetFunds, selectedTargetFundIsin });
    expect(component.find('button').first().hasClass('tv-target-fund__active')).toBe(false);
    expect(component.find('button').at(1).hasClass('tv-target-fund__active')).toBe(true);
    expect(component.find('button').last().hasClass('tv-target-fund__active')).toBe(false);
  });

  it('can select a target fund', () => {
    const onSelectFund = jest.fn();
    const targetFunds = [
      { isin: '123' },
      { isin: '456' },
      { isin: '789' },
    ];
    component.setProps({ targetFunds, onSelectFund });
    expect(onSelectFund).not.toHaveBeenCalled();
    component.find('button').last().simulate('click');
    expect(onSelectFund).toHaveBeenCalledTimes(1);
    expect(onSelectFund).toHaveBeenCalledWith(targetFunds[2]);
  });
});
