import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import { Comparison } from './Comparison';

describe('Comparison widget', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {};
    component = shallow(<Comparison {...props} />);
  });

  it('renders comparison intro texts', () => {
    expect(component.contains(<Message>comparison.intro</Message>)).toBe(true);
    expect(component.contains(<Message>comparison.call.to.action</Message>)).toBe(true);
  });

  it('renders form headers', () => {
    expect(component.contains(<Message>comparison.your.gross.salary.today</Message>)).toBe(true);
    expect(component.contains(<Message>comparison.expected.index.return</Message>)).toBe(true);
  });


  it('renders form fields', () => {
    const salary = 123;
    const onSalaryChange = jest.fn();
    component.setProps({
      salary,
      onSalaryChange,
    });

    expect(component.find('input')).length === 2;
  });

  it('renders comparison table headers', () => {
    expect(component.contains(
      <tr>
        <th><Message>comparison.output.calculation</Message></th>
        <th><Message>comparison.output.old.funds</Message></th>
        <th><Message>comparison.output.new.funds</Message></th>
      </tr>,
    )).toBe(true);
  });

  it('if comparison is present, render table messages', () => {
    const comparison = {
      currentFundFee: 123,
      newFundFee: 234,
      currentFundFutureValue: 345,
      newFundFutureValue: 456,
    };

    component.setProps({ comparison });
    expect(component.contains(<td className="output-amount old-fund-fees">
      {Math.round(comparison.currentFundFee)}
    </td>)).toBe(true);
    expect(component.contains(
      <td className="output-amount">{Math.round(comparison.newFundFee)}</td>)).toBe(true);
    expect(component.contains(<td className="output-amount">
      {Math.round(comparison.currentFundFutureValue)}
    </td>)).toBe(true);
    expect(component.contains(<td className="output-amount new-fund-total">
      {Math.round(comparison.newFundFutureValue)}
    </td>)).toBe(true);
  });

  it('if comparison is present, render table values', () => {
    component.setProps({ comparison: null });
    expect(component.contains(
      <Message>comparison.output.calculation.first.row</Message>)).not.toBe(true);
    expect(component.contains(
      <Message>comparison.output.calculation.first.row.tooltip.content</Message>)).not.toBe(true);
    expect(component.contains(
      <Message>comparison.output.calculation.second.row</Message>)).not.toBe(true);
    component.setProps({ comparison: {} });
    expect(component.contains(
      <Message>comparison.output.calculation.first.row</Message>)).toBe(true);
    expect(component.contains(
      <Message>comparison.output.calculation.first.row.tooltip.content</Message>)).toBe(true);
    expect(component.contains(
      <Message>comparison.output.calculation.second.row</Message>)).toBe(true);
  });

  it('renders close button', () => {
    component.setProps({ overlayed: true });
    expect(component.contains(<Message>comparison.close</Message>)).toBe(true);
  });

  it('renders as a modal when it is overlayed', () => {
    const isComponentModal = () => component.at(0).hasClass('tv-modal');
    expect(isComponentModal()).toBe(false);
    component.setProps({ overlayed: true });
    expect(isComponentModal()).toBe(true);
  });
});
