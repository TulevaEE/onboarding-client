import React from 'react';
import { shallow } from 'enzyme';

import { Redirect } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { ErrorMessage, Loader, Radio } from '../../../common';
import ExactFundSelector from './exactFundSelector';
import TargetFundSelector from './targetFundSelector';
import { SelectSources } from './SelectSources';
import AccountStatement from '../../../account/AccountStatement';

// TODO: Figure out a cleaner way to mock the hook
jest.mock('../../../common/apiHooks', () => ({
  useMandateDeadlines: () => ({ data: { periodEnding: '2023-07-31T20:59:59.999999999Z' } }),
}));

describe('Select sources step', () => {
  let component;

  beforeEach(() => {
    component = shallow(
      <SelectSources nextPath="/2nd-pillar-flow/address" sourceFunds={[]} targetFunds={[]} />,
    );
  });

  it('renders a loader when loading source or target funds', () => {
    component.setProps({ loadingSourceFunds: true });
    expect(component.get(0)).toEqual(<Loader className="align-middle" />);
    component.setProps({ loadingSourceFunds: false, loadingTargetFunds: true });
    expect(component.get(0)).toEqual(<Loader className="align-middle" />);
  });

  it('does not render a loader when funds loaded', () => {
    component.setProps({
      loadingSourceFunds: false,
      loadingTargetFunds: false,
      sourceFunds: [{ isin: 'a' }],
      targetFunds: [{ isin: 'b' }],
    });
    expect(component.get(0)).not.toEqual(<Loader className="align-middle" />);
  });

  it('renders a pension fund table with given funds', () => {
    const sourceFunds = [{ iAmAFund: true }, { iAmAlsoAFund: true }];
    component.setProps({ sourceFunds, targetFunds: [] });
    expect(
      component.contains(
        <AccountStatement
          funds={sourceFunds}
          activeFundNotice={<FormattedMessage id="select.sources.active.fund" />}
        />,
      ),
    ).toBe(true);
  });

  it('renders a button to the next step', () => {
    const nextPath = '/next-path';
    component.setProps({ nextPath });

    expect(component.find('#nextStep').prop('to')).toBe(nextPath);
    expect(component.find('#nextStep button').children().at(0).getElement(0)).toMatchSnapshot();
  });

  it('on exact selection disables the next step button if selection is invalid', () => {
    component.setProps({
      sourceSelectionExact: true,
      sourceSelection: [{ sourceFundIsin: 'a', percentage: 1 }],
      selectedFutureContributionsFundIsin: 'a',
    });
    component.find('#someExistingSwitch').simulate('change', { target: { checked: true } });

    expect(component.find('#nextStep button').prop('className')).not.toContain('disabled');
    expect(
      component.contains(
        <FormattedMessage id="select.sources.error.source.fund.percentages.over.100" />,
      ),
    ).toBe(false);

    component.setProps({
      sourceSelection: [
        { sourceFundIsin: 'a', percentage: 1 },
        { sourceFundIsin: 'a', percentage: 1 },
      ],
      selectedFutureContributionsFundIsin: 'a',
    });
    expect(component.find('#nextStep button').prop('className')).toContain('disabled');
    expect(
      component.contains(
        <FormattedMessage id="select.sources.error.source.fund.percentages.over.100" />,
      ),
    ).toBe(true);
  });

  it('on exact selection disables the next step button if selection is invalid due to inter fund transfer and displays help text', () => {
    component.setProps({
      sourceSelectionExact: true,
      sourceSelection: [
        {
          sourceFundIsin: 'a',
          targetFundIsin: 'b',
          percentage: 1,
        },
      ],
    });
    component.find('#someExistingSwitch').simulate('change', { target: { checked: true } });

    expect(component.find('#nextStep button').prop('className')).not.toContain('disabled');
    expect(
      component.contains(<FormattedMessage id="select.sources.error.source.fund.is.target.fund" />),
    ).toBe(false);

    component.setProps({
      sourceSelection: [
        {
          sourceFundIsin: 'a',
          targetFundIsin: 'a',
          percentage: 1,
        },
      ],
    });
    expect(component.find('#nextStep button').prop('className')).toContain('disabled');

    expect(
      component.contains(<FormattedMessage id="select.sources.error.source.fund.is.target.fund" />),
    ).toBe(true);
  });

  it('on not exact selection does not disables the next step button if selection is invalid due to inter fund transfer and displays help text', () => {
    component.setProps({
      sourceSelectionExact: false,
      sourceSelection: [
        {
          sourceFundIsin: 'a',
          targetFundIsin: 'b',
          percentage: 1,
        },
      ],
    });
    expect(component.find('#nextStep button').prop('className')).not.toContain('disabled');
    expect(
      component.contains(<FormattedMessage id="select.sources.error.source.fund.is.target.fund" />),
    ).toBe(false);

    component.setProps({
      sourceSelection: [
        {
          sourceFundIsin: 'a',
          targetFundIsin: 'a',
          percentage: 1,
        },
      ],
    });
    expect(component.find('#nextStep button').prop('className')).not.toContain('disabled');

    expect(
      component.contains(<FormattedMessage id="select.sources.error.source.fund.is.target.fund" />),
    ).toBe(false);
  });

  it('sets the full selection radio as selected only when all funds selected', () => {
    const fullSelectionRadio = () => component.find(Radio).first();
    component.setProps({
      sourceSelectionExact: false,
      sourceSelection: [
        { name: 'a', percentage: 1 },
        { name: 'b', percentage: 1 },
      ],
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
    const onSelectExchangeSources = jest.fn();
    const sourceFunds = [{ isin: 'a' }, { isin: 'b' }];
    const targetFunds = [{ isin: 'c', fundManager: { name: 'Tuleva' } }];
    const fullSelection = [
      { sourceFundIsin: 'a', targetFundIsin: 'c', percentage: 1 },
      { sourceFundIsin: 'b', targetFundIsin: 'c', percentage: 1 },
    ];
    component.setProps({ sourceFunds, targetFunds, onSelectExchangeSources });
    expect(onSelectExchangeSources).not.toHaveBeenCalled();
    component.find(Radio).first().simulate('select');
    expect(onSelectExchangeSources).toHaveBeenCalledTimes(1);
    expect(onSelectExchangeSources).toHaveBeenCalledWith(fullSelection, false);
  });

  it('when selecting all funds, skip inter fund transfer', () => {
    const onSelectExchangeSources = jest.fn();
    const sourceFunds = [{ isin: 'c', fundManager: { name: 'Tuleva' } }, { isin: 'b' }];
    const targetFunds = [{ isin: 'c', fundManager: { name: 'Tuleva' } }];
    const fullSelection = [
      {
        sourceFundIsin: 'b',
        targetFundIsin: 'c',
        percentage: 1,
      },
    ];
    component.setProps({ sourceFunds, targetFunds, onSelectExchangeSources });
    expect(onSelectExchangeSources).not.toHaveBeenCalled();
    component.find(Radio).first().simulate('select');
    expect(onSelectExchangeSources).toHaveBeenCalledTimes(1);
    expect(onSelectExchangeSources).toHaveBeenCalledWith(fullSelection, false);
  });

  it('when selecting all funds and the default fund (first target fund) is the only source fund, dont skip it', () => {
    const onSelectExchangeSources = jest.fn();
    const sourceFunds = [{ isin: 'c', fundManager: { name: 'Tuleva' } }];
    const targetFunds = [{ isin: 'c', fundManager: { name: 'Tuleva' } }, { isin: 'b' }];
    const fullSelection = [
      {
        sourceFundIsin: 'c',
        targetFundIsin: 'c',
        percentage: 1,
      },
    ];
    component.setProps({ sourceFunds, targetFunds, onSelectExchangeSources });
    expect(onSelectExchangeSources).not.toHaveBeenCalled();
    component.find(Radio).first().simulate('select');
    expect(onSelectExchangeSources).toHaveBeenCalledTimes(1);
    expect(onSelectExchangeSources).toHaveBeenCalledWith(fullSelection, false);
  });

  it('sets the no selection radio as selected only when no funds selected', () => {
    const futureSelectionRadio = () => component.find(Radio).at(1);
    component.setProps({
      sourceSelectionExact: false,
      sourceSelection: [],
      targetFunds: [{ isin: 'c', fundManager: { name: 'Tuleva' } }],
    });

    expect(futureSelectionRadio().prop('selected')).toBe(true);

    component.setProps({ sourceSelectionExact: true });
    expect(futureSelectionRadio().prop('selected')).toBe(false);

    component.setProps({
      sourceSelectionExact: false,
      sourceSelection: [
        { name: 'a', percentage: 0.5 },
        { name: 'b', percentage: 1 },
      ],
    });
    expect(futureSelectionRadio().prop('selected')).toBe(false);
  });

  it('shows subtitle for future funds only when it is selected', () => {
    const futureSelectionRadio = () => component.find(Radio).at(1);

    component.setProps({
      sourceSelectionExact: false,
      sourceSelection: [],
      targetFunds: [{ isin: 'c', fundManager: { name: 'Tuleva' } }],
    });

    expect(futureSelectionRadio().prop('selected')).toBe(true);
    expect(
      component.contains(<FormattedMessage id="select.sources.select.future.subtitle" />),
    ).toBe(true);

    component.setProps({
      sourceSelectionExact: false,
      sourceSelection: [
        { name: 'a', percentage: 0.5 },
        { name: 'b', percentage: 1 },
      ],
    });

    expect(futureSelectionRadio().prop('selected')).toBe(false);
    expect(
      component.contains(<FormattedMessage id="select.sources.select.future.subtitle" />),
    ).toBe(false);
  });

  it('selects future funds when clicking on the future funds radio', () => {
    const onSelectExchangeSources = jest.fn();
    const sourceFunds = [{ isin: 'a' }, { isin: 'b' }];
    component.setProps({ sourceFunds, onSelectExchangeSources });
    expect(onSelectExchangeSources).not.toHaveBeenCalled();
    component.find(Radio).at(1).simulate('select');
    expect(onSelectExchangeSources).toHaveBeenCalledTimes(1);
    expect(onSelectExchangeSources).toHaveBeenCalledWith([], false);
  });

  it('sets the exact fund selector active as selected when fund selection is exact', () => {
    component.setProps({ sourceSelectionExact: true });
    const exactFundSelector = () => component.find(Radio).last();
    expect(exactFundSelector().prop('selected')).toBe(true);
    component.setProps({ sourceSelectionExact: false });
    expect(exactFundSelector().prop('selected')).toBe(false);
  });

  it('shows the exact fund selector when fund selection is exact', () => {
    const exactFundSelectorRendered = () => !!component.find(ExactFundSelector).length;
    component.setProps({ sourceSelectionExact: true });
    component.find('#someExistingSwitch').simulate('change', { target: { checked: true } });
    expect(exactFundSelectorRendered()).toBe(true);
    component.setProps({ sourceSelectionExact: false });
    expect(exactFundSelectorRendered()).toBe(false);
  });

  it('shows switches for exact fund selection when selection is exact', () => {
    const subtitleRendered = () =>
      component.contains(<FormattedMessage id="select.sources.select.some.existing" />) &&
      component.contains(<FormattedMessage id="select.sources.select.some.future" />);
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
    component.setProps({
      sourceSelectionExact: true,
      sourceSelection,
      sourceFunds,
      targetFunds,
    });
    component.find('#someExistingSwitch').simulate('change', { target: { checked: true } });

    const selectorProp = (name) => component.find(ExactFundSelector).prop(name);
    expect(selectorProp('selections')).toBe(sourceSelection);
    expect(selectorProp('sourceFunds')).toBe(sourceFunds);
    expect(selectorProp('targetFunds')).toBe(targetFunds);
  });

  it('selects exact funds when the selector tells it to', () => {
    const onSelectExchangeSources = jest.fn();
    component.setProps({ onSelectExchangeSources, sourceSelectionExact: true });
    const selection = [
      { name: 'a', percentage: 0.7 },
      { name: 'b', percentage: 0.8 },
    ];
    expect(onSelectExchangeSources).not.toHaveBeenCalled();
    component.find('#someExistingSwitch').simulate('change', { target: { checked: true } });
    component.find(ExactFundSelector).simulate('change', selection);
    expect(onSelectExchangeSources).toHaveBeenCalledTimes(2);
    expect(onSelectExchangeSources).toHaveBeenCalledWith(selection, true);
  });

  it('passes only Tuleva funds to the target fund selector', () => {
    const tulevaFund = { isin: 'b', fundManager: { name: 'Tuleva' } };
    const targetFunds = [{ isin: 'a' }, tulevaFund];

    component.setProps({
      sourceSelection: [{ name: 'a', percentage: 1 }],
      sourceSelectionExact: false,
      targetFunds,
    });
    expect(component.find(TargetFundSelector).prop('targetFunds')).toEqual([tulevaFund]);
  });

  it('renders error', () => {
    const error = { body: 'aww no' };
    const funds = [{ aFund: true }];

    component.setProps({ error, funds });

    expect(component.contains(<ErrorMessage errors={error.body} />)).toBe(true);
    expect(component.contains(<Loader className="align-middle" />)).toBe(false);
    expect(component.contains(<AccountStatement funds={funds} />)).toBe(false);
  });
});
