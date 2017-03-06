import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import ExactFundSelector from './ExactFundSelector';

describe('Exact fund selector', () => {
  let component;

  beforeEach(() => {
    component = shallow(<ExactFundSelector />);
  });

  it('renders a header for the selection table', () => {
    expect(component.contains(<Message>select.sources.select.some.current</Message>)).toBe(true);
    expect(component.contains(<Message>select.sources.select.some.select</Message>)).toBe(true);
  });

  it('renders a table row with a selector for every fund selection', () => {
    const selections = [
      { name: 'test 1', isin: 'isin 1', percentage: 0.7 },
      { name: 'test 2', isin: 'isin 2', percentage: 0.8 },
      { name: 'test 3', isin: 'isin 3', percentage: 0.9 },
    ];
    component.setProps({ selections });
    selections.forEach((fund) => {
      expect(component.contains(<Message>{fund.name}</Message>)).toBe(true);
      expect(component
        .findWhere(node =>
          node.node.type === 'input' &&
          node.prop('value') === fund.percentage * 100).length).toBe(1);
    });
  });

  it('can change the selection when a new value is entered', () => {
    const selections = [
      { name: 'test 1', isin: 'isin 1', percentage: 0.7 },
      { name: 'test 2', isin: 'isin 2', percentage: 0.8 },
    ];
    const expectedSelectionsAfterChange = [
      { name: 'test 1', isin: 'isin 1', percentage: 0.4 },
      { name: 'test 2', isin: 'isin 2', percentage: 0.8 },
    ];
    const onSelect = jest.fn();
    component.setProps({ selections, onSelect });
    const fakeEvent = value => ({ target: { value } });

    expect(onSelect).not.toHaveBeenCalled();
    component
      .findWhere(node =>
        node.node.type === 'input' &&
        node.prop('value') === 70)
      .simulate('change', fakeEvent('40'));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(expectedSelectionsAfterChange);
  });
});
