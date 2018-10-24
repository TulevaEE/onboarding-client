import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import FundExchangeRow from './fundExchangeRow';
import ExactFundSelector from './ExactFundSelector';

describe('Exact fund selector', () => {
  let component;
  let selections;
  let sourceFunds;
  let targetFunds;

  beforeEach(() => {
    selections = [
      {
        sourceFundIsin: 'source isin 1',
        targetFundIsin: 'target isin 1',
        percentage: 0.7,
      },
      {
        sourceFundIsin: 'source isin 2',
        targetFundIsin: 'target isin 2',
        percentage: 0.8,
      },
      {
        sourceFundIsin: 'source isin 3',
        targetFundIsin: 'target isin 3',
        percentage: 0.9,
      },
    ];
    sourceFunds = [
      { isin: 'source isin 1', name: 'source name 1', fundManager: { name: 'Tuleva' } },
      { isin: 'source isin 2', name: 'source name 2' },
      { isin: 'source isin 3', name: 'source name 3' },
    ];
    targetFunds = [
      { isin: 'target isin 1', name: 'target name 1', fundManager: { name: 'Tuleva' } },
      { isin: 'target isin 2', name: 'target name 2' },
      { isin: 'target isin 3', name: 'target name 3' },
    ];
    component = shallow(<ExactFundSelector />);
  });

  it('renders a header for the selection table', () => {
    expect(component.contains(<Message>select.sources.select.some.source</Message>)).toBe(true);
    expect(component.contains(<Message>select.sources.select.some.percentage</Message>)).toBe(true);
    expect(component.contains(<Message>select.sources.select.some.target</Message>)).toBe(true);
  });

  it('renders a table row with selectors for every fund', () => {
    component.setProps({ selections, sourceFunds, targetFunds });

    selections.forEach((row, index) => {
      const rowComponentProp = name =>
        component
          .find(FundExchangeRow)
          .at(index)
          .prop(name);
      expect(rowComponentProp('sourceFunds')).toBe(sourceFunds);
      expect(rowComponentProp('targetFunds')).toBe(targetFunds);
      expect(rowComponentProp('selection')).toBe(row);
    });
  });

  it('can change the selection when a new value is entered', () => {
    const newSecondSelection = {
      sourceFundIsin: 'source isin 2',
      targetFundIsin: 'target isin 10',
      percentage: 1,
    };
    const expectedSelectionsAfterChange = [selections[0], newSecondSelection, selections[2]];
    const onChange = jest.fn();
    component.setProps({ selections, onChange });

    expect(onChange).not.toHaveBeenCalled();
    component
      .find(FundExchangeRow)
      .at(1)
      .simulate('change', newSecondSelection);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(expectedSelectionsAfterChange);
  });

  it('renders info about cost and reference link', () => {
    expect(
      component.contains(
        <a
          href="//www.pensionikeskus.ee/ii-sammas/fondid/fonditasude-vordlused/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Message>select.sources.select.some.cost</Message>
        </a>,
      ),
    ).toBe(true);
  });

  it('can add rows', () => {
    const onChange = jest.fn();
    component.setProps({ selections, sourceFunds, targetFunds, onChange });
    expect(onChange).not.toHaveBeenCalled();
    component.find('button').simulate('click');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith([
      ...selections,
      {
        sourceFundIsin: sourceFunds[0].isin,
        targetFundIsin: targetFunds[0].isin,
        percentage: 1,
      },
    ]);
  });
});
