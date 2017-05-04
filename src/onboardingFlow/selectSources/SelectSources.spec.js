import React from 'react';
import { shallow } from 'enzyme';
import { Link } from 'react-router';
import { Message } from 'retranslate';

import { Loader, Radio, ErrorAlert } from '../../common';
import PensionFundTable from './pensionFundTable';
import ExactFundSelector from './exactFundSelector';
import TargetFundSelector from './targetFundSelector';
import { SelectSources } from './SelectSources';
import Comparison from '../../common/comparison';

describe('Select sources step', () => {
  let component;

  beforeEach(() => {
    component = shallow(<SelectSources />);
  });

  it('renders a loader when loading source or target funds', () => {
    component.setProps({ loadingSourceFunds: true });
    expect(component.get(0)).toEqual(<Loader className="align-middle" />);
    component.setProps({ loadingSourceFunds: false, loadingTargetFunds: true });
    expect(component.get(0)).toEqual(<Loader className="align-middle" />);
  });

  it('does not render a loader when funds loaded', () => {
    component.setProps({ loadingSourceFunds: false, loadingTargetFunds: false });
    expect(component.get(0)).not.toEqual(<Loader className="align-middle" />);
  });

  it('renders a title', () => {
    expect(component.contains(<Message>select.sources.current.status</Message>)).toBe(true);
  });

  it('renders a pension fund table with given funds', () => {
    const sourceFunds = [{ iAmAFund: true }, { iAmAlsoAFund: true }];
    component.setProps({ sourceFunds });
    expect(component.contains(<PensionFundTable funds={sourceFunds} />)).toBe(true);
  });

  it('renders a link to the next step', () => {
    expect(component.find(Link).prop('to')).toBe('/steps/transfer-future-capital');
    expect(component.find(Link).children().at(0).node).toEqual(<Message>steps.next</Message>);
  });

  it('sets the full selection radio as selected only when all funds selected', () => {
    const fullSelectionRadio = () => component.find(Radio).first();
    component.setProps({
      sourceSelectionExact: false,
      sourceSelection: [{ name: 'a', percentage: 1 }, { name: 'b', percentage: 1 }],
    });
    expect(fullSelectionRadio().prop('selected')).toBe(true);

    component.setProps({ sourceSelectionExact: true });
    expect(fullSelectionRadio().prop('selected')).toBe(false);

    component.setProps({
      sourceSelectionExact: false,
      sourceSelection: [],
    });
    expect(fullSelectionRadio().prop('selected')).toBe(false);
  });

  it('selects all funds when clicking on the full selection radio', () => {
    const onSelect = jest.fn();
    const sourceFunds = [{ isin: 'a' }, { isin: 'b' }];
    const targetFunds = [{ isin: 'c' }];
    const fullSelection = [
      { sourceFundIsin: 'a', targetFundIsin: 'c', percentage: 1 },
      { sourceFundIsin: 'b', targetFundIsin: 'c', percentage: 1 },
    ];
    component.setProps({ sourceFunds, targetFunds, onSelect });
    expect(onSelect).not.toHaveBeenCalled();
    component.find(Radio).first().simulate('select');
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(fullSelection, false);
  });

  it('when selecting all funds, skip inter fund transfer', () => {
    const onSelect = jest.fn();
    const sourceFunds = [{ isin: 'c' }, { isin: 'b' }];
    const targetFunds = [{ isin: 'c' }];
    const fullSelection = [
      { sourceFundIsin: 'b', targetFundIsin: 'c', percentage: 1 },
    ];
    component.setProps({ sourceFunds, targetFunds, onSelect });
    expect(onSelect).not.toHaveBeenCalled();
    component.find(Radio).first().simulate('select');
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(fullSelection, false);
  });

  it('sets the no selection radio as selected only when no funds selected', () => {
    const noneSelectionRadio = () => component.find(Radio).last();
    component.setProps({
      sourceSelectionExact: false,
      sourceSelection: [],
    });
    expect(noneSelectionRadio().prop('selected')).toBe(true);

    component.setProps({ sourceSelectionExact: true });
    expect(noneSelectionRadio().prop('selected')).toBe(false);

    component.setProps({
      sourceSelectionExact: false,
      sourceSelection: [{ name: 'a', percentage: 0.5 }, { name: 'b', percentage: 1 }],
    });
    expect(noneSelectionRadio().prop('selected')).toBe(false);
  });

  it('shows subtitle for no funds only when it is selected', () => {
    const noneSelectionRadio = () => component.find(Radio).last();
    component.setProps({
      sourceSelectionExact: false,
      sourceSelection: [],
    });

    expect(noneSelectionRadio().prop('selected')).toBe(true);
    expect(component.contains(<Message>select.sources.select.none.subtitle</Message>)).toBe(true);

    component.setProps({
      sourceSelectionExact: false,
      sourceSelection: [{ name: 'a', percentage: 0.5 }, { name: 'b', percentage: 1 }],
    });

    expect(noneSelectionRadio().prop('selected')).toBe(false);
    expect(component.contains(<Message>select.sources.select.none.subtitle</Message>)).toBe(false);
  });

  it('selects no funds when clicking on the no selection radio', () => {
    const onSelect = jest.fn();
    const sourceFunds = [{ isin: 'a' }, { isin: 'b' }];
    component.setProps({ sourceFunds, onSelect });
    expect(onSelect).not.toHaveBeenCalled();
    component.find(Radio).last().simulate('select');
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith([], false);
  });

  it('sets the exact fund selector active as selected when fund selection is exact', () => {
    component.setProps({ sourceSelectionExact: true });
    const exactFundSelector = () => component.find(Radio).at(1);
    expect(exactFundSelector().prop('selected')).toBe(true);
    component.setProps({ sourceSelectionExact: false });
    expect(exactFundSelector().prop('selected')).toBe(false);
  });

  it('shows the exact fund selector when fund selection is exact', () => {
    const exactFundSelectorRendered = () => !!component.find(ExactFundSelector).length;
    component.setProps({ sourceSelectionExact: true });
    expect(exactFundSelectorRendered()).toBe(true);
    component.setProps({ sourceSelectionExact: false });
    expect(exactFundSelectorRendered()).toBe(false);
  });

  it('shows the subtitle for exact fund selection when selection is exact', () => {
    const subtitleRendered = () => component
      .contains(<Message>select.sources.select.some.subtitle</Message>);
    component.setProps({ sourceSelectionExact: false });
    expect(subtitleRendered()).toBe(false);
    component.setProps({ sourceSelectionExact: true });
    expect(subtitleRendered()).toBe(true);
  });

  it('passes the current selection and funds to the exact fund selector', () => {
    const sourceSelection = [
      { sourceFundIsin: 'a', targetFundIsin: 'c', percentage: 1 },
      { sourceFundIsin: 'b', targetFundIsin: 'c', percentage: 1 },
    ];
    const sourceFunds = [{ isin: 'a' }, { isin: 'b' }];
    const targetFunds = [{ isin: 'c' }];
    component.setProps({ sourceSelectionExact: true, sourceSelection, sourceFunds, targetFunds });
    const selectorProp = name => component.find(ExactFundSelector).prop(name);
    expect(selectorProp('selections')).toBe(sourceSelection);
    expect(selectorProp('sourceFunds')).toBe(sourceFunds);
    expect(selectorProp('targetFunds')).toBe(targetFunds);
  });

  it('selects exact funds when the selector tells it to', () => {
    const onSelect = jest.fn();
    component.setProps({ onSelect, sourceSelectionExact: true });
    const selection = [{ name: 'a', percentage: 0.7 }, { name: 'b', percentage: 0.8 }];
    expect(onSelect).not.toHaveBeenCalled();
    component.find(ExactFundSelector).simulate('change', selection);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(selection, true);
  });

  it('passes the recommended fund isin forward to the target fund selector', () => {
    const recommendedFundIsin = 'asd';
    component.setProps({
      sourceSelection: [{ name: 'a', percentage: 1 }],
      sourceSelectionExact: false,
      recommendedFundIsin,
    });
    expect(component.find(TargetFundSelector).prop('recommendedFundIsin'))
      .toBe(recommendedFundIsin);
  });

  it('disables the next step button if selection is invalid', () => {
    component.setProps({ sourceSelection: [{ sourceFundIsin: 'a', percentage: 1 }] });
    expect(component.find(Link).prop('className')).not.toContain('disabled');
    component.setProps({
      sourceSelection: [
        { sourceFundIsin: 'a', percentage: 1 },
        { sourceFundIsin: 'a', percentage: 1 },
      ],
    });
    expect(component.find(Link).prop('className')).toContain('disabled');
  });

  it('disables the next step button if selection is invalid due to inter fund transfer', () => {
    component.setProps({ sourceSelection: [{ sourceFundIsin: 'a', targetFundIsin: 'b', percentage: 1 }] });
    expect(component.find(Link).prop('className')).not.toContain('disabled');
    component.setProps({
      sourceSelection: [
        { sourceFundIsin: 'a', targetFundIsin: 'a', percentage: 1 },
      ],
    });
    expect(component.find(Link).prop('className')).toContain('disabled');
  });

  it('passes an error forwards to ErrorAlert and does not show other components', () => {
    const errorDescription = 'aww no';
    const funds = [{ aFund: true }];

    component.setProps({ errorDescription, funds });

    expect(component.contains(<ErrorAlert description={errorDescription} />)).toBe(true);
    expect(component.contains(<Loader className="align-middle" />)).toBe(false);
    expect(component.contains(<PensionFundTable funds={funds} />)).toBe(false);
  });

  it('can hide and show comparison', () => {
    const onHideComparison = () => jest.fn();
    component.setProps({
      onHideComparison,
      comparisonVisible: true,
    });

    expect(component.contains(<Comparison overlayed onClose={onHideComparison} />)).toBe(true);
    component.setProps({ comparisonVisible: false });
    expect(component.contains(<Comparison overlayed onClose={onHideComparison} />)).toBe(false);
  });

  it('displays show comparison', () => {
    const onShowComparison = () => jest.fn();

    component.setProps({ onShowComparison });

    expect(component.contains(<button
      className={'btn btn-primary mt-3 mb-3'}
      onClick={onShowComparison}
    ><Message>select.sources.show.comparison</Message></button>)).toBe(true);
  });
});
