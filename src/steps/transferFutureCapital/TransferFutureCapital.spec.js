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

  it('has two options if you want to transfer future capital', () => {
    expect(component.find(Radio).length).toBe(2);
    expect(component.find(Radio)
      .at(0)
      .childAt(0)
      .childAt(0)
      .get(0)).toEqual(<Message>transfer.future.capital.yes</Message>);
    expect(component.find(Radio)
      .at(1)
      .childAt(0)
      .childAt(0)
      .get(0)).toEqual(<Message>transfer.future.capital.no</Message>);
  });

  it('can change if you want to transfer future capital', () => {
    const radioAtIndexSelected = index => component.find(Radio).at(index).prop('selected');
    expect(radioAtIndexSelected(0)).toBe(true);
    expect(radioAtIndexSelected(1)).toBe(false);
    const selectRadioAtIndex = index => component.find(Radio).at(index).prop('onSelect')();
    const onChangeTransferFutureCapital = jest.fn();
    component.setProps({ onChangeTransferFutureCapital });

    expect(onChangeTransferFutureCapital).not.toHaveBeenCalled();
    selectRadioAtIndex(1);
    expect(onChangeTransferFutureCapital).toHaveBeenCalledTimes(1);
    expect(onChangeTransferFutureCapital).toHaveBeenCalledWith(false);
    onChangeTransferFutureCapital.mockClear();

    component.setProps({ transferFutureCapital: false });
    expect(radioAtIndexSelected(0)).toBe(false);
    expect(radioAtIndexSelected(1)).toBe(true);

    expect(onChangeTransferFutureCapital).not.toHaveBeenCalled();
    selectRadioAtIndex(0);
    expect(onChangeTransferFutureCapital).toHaveBeenCalledTimes(1);
    expect(onChangeTransferFutureCapital).toHaveBeenCalledWith(true);
  });
});
