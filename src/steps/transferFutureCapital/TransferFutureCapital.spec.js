import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';
import { Link } from 'react-router';

import { Radio } from '../../common';
import { TransferFutureCapital } from './TransferFutureCapital';

describe('Transfer future capital step', () => {
  let component;

  beforeEach(() => {
    component = shallow(<TransferFutureCapital />);
  });

  it('shows an intro', () => {
    expect(component.contains(
      <Message>
        transfer.future.capital.intro
      </Message>,
      <Message>
        transfer.future.capital.intro.choose
      </Message>,
    )).toBe(true);
  });

  it('has buttons to the previous and next pages', () => {
    expect(component.contains(
      <Link className="btn btn-primary mr-2" to="/steps/confirm-mandate">
        <Message>steps.next</Message>
      </Link>,
    )).toBe(true);
    expect(component.contains(
      <Link className="btn btn-secondary" to="/steps/select-sources">
        <Message>steps.previous</Message>
      </Link>,
    )).toBe(true);
  });

  it('has three options if you want to transfer future capital to one of two funds or not', () => {
    const targetFunds = [{ isin: 'AAA'}, { isin: 'BBB'}];
    const loadingTargetFunds = false;
    component.setProps({ targetFunds, loadingTargetFunds });
    expect(component.find(Radio).length).toBe(3);
    expect(component.find(Radio)
      .at(0)
      .childAt(0)
      .childAt(0)
      .get(0)).toEqual(<Message>transfer.future.capital.AAA.fund</Message>);
    expect(component.find(Radio)
      .at(1)
      .childAt(0)
      .childAt(0)
      .get(0)).toEqual(<Message>transfer.future.capital.BBB.fund</Message>);
    expect(component.find(Radio)
      .at(2)
      .childAt(0)
      .childAt(0)
      .get(0)).toEqual(<Message>transfer.future.capital.no</Message>);
  });

  it('can where you want to transfer future capital', () => {
    const targetFunds = [{ isin: 'AAA'}, { isin: 'BBB'}];
    const loadingTargetFunds = false;
    let selectedTargetFund = { isin: 'AAA'};
    component.setProps({ targetFunds, loadingTargetFunds, selectedTargetFund });

    const radioAtIndexSelected = index => component.find(Radio).at(index).prop('selected');
    expect(radioAtIndexSelected(0)).toBe(true);
    expect(radioAtIndexSelected(1)).toBe(false);
    expect(radioAtIndexSelected(2)).toBe(false);

    const selectRadioAtIndex = index => component.find(Radio).at(index).prop('onSelect')();
    const onSelectFutureCapitalFund = jest.fn();
    component.setProps({ onSelectFutureCapitalFund });

    expect(onSelectFutureCapitalFund).not.toHaveBeenCalled();
    selectRadioAtIndex(2);
    expect(onSelectFutureCapitalFund).toHaveBeenCalledTimes(1);
    expect(onSelectFutureCapitalFund).toHaveBeenCalledWith(null);
    onSelectFutureCapitalFund.mockClear();

    selectRadioAtIndex(1);
    expect(onSelectFutureCapitalFund).toHaveBeenCalledTimes(1);
    expect(onSelectFutureCapitalFund).toHaveBeenCalledWith({isin: "BBB"});
    onSelectFutureCapitalFund.mockClear();
  });
});
