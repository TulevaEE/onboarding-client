import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';
import { Link } from 'react-router';

import { Loader, Radio } from '../../common';
import { SelectTargetFund } from './SelectTargetFund';

describe('Select target fund step', () => {
  let component;

  beforeEach(() => {
    component = shallow(<SelectTargetFund />);
  });

  it('renders buttons to go forward and backward', () => {
    expect(component.contains(
      <Link className="btn btn-primary mr-2" to="/steps/transfer-future-capital">
        <Message>steps.next</Message>
      </Link>,
    )).toBe(true);
    expect(component.contains(
      <Link className="btn btn-secondary" to="/steps/select-sources">
        <Message>steps.previous</Message>
      </Link>,
    )).toBe(true);
  });

  it('renders a loader instead of the component when it is still loading available funds', () => {
    component.setProps({ loadingTargetFunds: true });
    expect(component.find(Loader).length).toBe(1);
    expect(component.get(0)).toEqual(<Loader className="align-middle" />);
  });

  it('renders selectable radios for every available target fund', () => {
    const onSelectTargetFund = jest.fn();
    const targetFunds = [{ isin: '1' }, { isin: '2' }];
    component.setProps({ targetFunds, onSelectTargetFund });
    expect(component.find(Radio).length).toBe(2);
    const selectTargetFundWithIndex = index => component.find(Radio).at(index).prop('onSelect')();
    expect(onSelectTargetFund).not.toHaveBeenCalled();
    selectTargetFundWithIndex(1);
    expect(onSelectTargetFund).toHaveBeenCalledTimes(1);
    expect(onSelectTargetFund).toHaveBeenCalledWith(targetFunds[1]);
  });

  it('sets the current selected fund as selected', () => {
    const targetFunds = [{ isin: '1' }, { isin: '2' }];
    const selectedTargetFund = targetFunds[1];
    component.setProps({ targetFunds, selectedTargetFund });
    const targetFundWithIndexSelected = index => component.find(Radio).at(index).prop('selected');
    expect(targetFundWithIndexSelected(1)).toBe(true);
    expect(targetFundWithIndexSelected(0)).toBe(false);
  });
});
