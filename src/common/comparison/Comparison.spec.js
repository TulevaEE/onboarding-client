import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import { Comparison } from './Comparison';
import ComparisonFootnotes from '../comparisonFootnotes';

import { Loader } from '../';

describe('Comparison', () => {
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

  it('renders a loader when loading comparison and results table when not loading', () => {
    component.setProps({ loading: true });
    expect(component.contains(<Loader className="align-middle mt-4" />)).toBe(true);
    expect(component.find('table').length).toBe(0);
    component.setProps({ loading: false });
    expect(component.contains(<Loader className="align-middle mt-4" />)).not.toBe(true);
    expect(component.find('table').length).toBe(1);
  });

  it('renders form fields', () => {
    const salary = 123;
    const onSalaryChange = jest.fn();
    component.setProps({
      salary,
      onSalaryChange,
    });

    expect(component.find('input').length).toBe(2);
    expect(component.find('input').at(0).prop('onChange')).not.toBe(null);
    expect(component.find('input').at(1).prop('onChange')).not.toBe(null);
  });

  it('renders comparison table headers', () => {
    expect(component.contains(
      <th className="text-right"><Message>comparison.output.old.funds</Message></th>,
    )).toBe(true);
    expect(component.contains(
      <th className="text-right"><Message>comparison.output.new.funds</Message></th>,
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
    expect(component.contains(<td className="output-amount old-fund-fees text-right">
      {Math.round(comparison.currentFundFee).toLocaleString('et-EE')}&nbsp;&euro;
    </td>)).toBe(true);
    expect(component.contains(
      <td className="output-amount new-fund-fees text-right">{Math.round(comparison.newFundFee).toLocaleString('et-EE')}&nbsp;&euro;</td>)).toBe(true);
    expect(component.contains(<td className="output-amount text-right">
      {Math.round(comparison.currentFundFutureValue).toLocaleString('et-EE')}&nbsp;&euro;
    </td>)).toBe(true);
    expect(component.contains(<td className="output-amount text-right">
      {Math.round(comparison.newFundFutureValue).toLocaleString('et-EE')}&nbsp;&euro;
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

  it('renders comaprison footnotes', () => {
    expect(component.contains(
      <ComparisonFootnotes />,
    )).toBe(true);
  });
});
