import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';
import { Link } from 'react-router-dom';

import { Radio } from '../../../common';
import { TransferFutureCapital } from './TransferFutureCapital';

describe('Transfer future capital step', () => {
  let component;

  beforeEach(() => {
    const props = { translations: { translate: () => '' } };
    component = shallow(<TransferFutureCapital {...props} />);
  });

  it('shows an intro', () => {
    expect(component.contains(<Message>transfer.future.capital.intro.choose</Message>)).toBe(true);
  });

  it('has buttons to the previous and next pages', () => {
    expect(
      component.contains(
        <Link className="btn btn-primary mb-2 mr-2" to="/2nd-pillar-flow/confirm-mandate">
          <Message>steps.next</Message>
        </Link>,
      ),
    ).toBe(true);
    expect(
      component.contains(
        <Link className="btn btn-secondary mb-2" to="/2nd-pillar-flow/select-sources">
          <Message>steps.previous</Message>
        </Link>,
      ),
    ).toBe(true);
  });

  it('has three options if you want to transfer future capital to one of two funds or not', () => {
    const targetFunds = [
      { isin: 'AAA', name: 'A', fundManager: { name: 'Tuleva' } },
      { isin: 'BBB', name: 'B', fundManager: { name: 'Tuleva' } },
      { isin: 'CCC', name: 'C', fundManager: { name: 'some random bank' } },
    ];
    const loadingTargetFunds = false;
    component.setProps({ targetFunds, loadingTargetFunds });
    expect(component.find(Radio).length).toBe(3);
    expect(
      component
        .find(Radio)
        .at(0)
        .childAt(0)
        .text(),
    ).toEqual('A<InfoTooltip />');
    expect(
      component
        .find(Radio)
        .at(1)
        .childAt(0)
        .text(),
    ).toEqual('B<InfoTooltip />');
    expect(
      component
        .find(Radio)
        .at(2)
        .childAt(0)
        .childAt(0)
        .get(0),
    ).toEqual(<Message>transfer.future.capital.no</Message>);
  });

  it('has unique id-s based on isin or none for option radios', () => {
    const targetFunds = [
      { isin: 'AAA', name: 'A', fundManager: { name: 'Tuleva' } },
      { isin: 'BBB', name: 'B', fundManager: { name: 'Tuleva' } },
      { isin: 'CCC', name: 'C', fundManager: { name: 'some random bank' } },
    ];
    component.setProps({ targetFunds });

    const ids = component.find(Radio).map(radio => radio.prop('id'));

    expect(ids).toEqual([
      'tv-transfer-future-capital-AAA',
      'tv-transfer-future-capital-BBB',
      'tv-transfer-future-capital-none',
    ]);
  });

  it('can choose where you want to transfer future capital', () => {
    const targetFunds = [
      { isin: 'AAA', name: 'A', fundManager: { name: 'Tuleva' } },
      { isin: 'BBB', name: 'B', fundManager: { name: 'Tuleva' } },
      { isin: 'CCC', name: 'C', fundManager: { name: 'some random bank' } },
    ];
    const loadingTargetFunds = false;
    const selectedFutureContributionsFundIsin = 'AAA';
    component.setProps({
      targetFunds,
      loadingTargetFunds,
      selectedFutureContributionsFundIsin,
    });

    const radioAtIndexSelected = index =>
      component
        .find(Radio)
        .at(index)
        .prop('selected');
    expect(radioAtIndexSelected(0)).toBe(true);
    expect(radioAtIndexSelected(1)).toBe(false);
    expect(radioAtIndexSelected(2)).toBe(false);

    const selectRadioAtIndex = index =>
      component
        .find(Radio)
        .at(index)
        .prop('onSelect')();
    const onSelectFutureCapitalFund = jest.fn();
    component.setProps({ onSelectFutureCapitalFund });

    expect(onSelectFutureCapitalFund).not.toHaveBeenCalled();
    selectRadioAtIndex(2);
    expect(onSelectFutureCapitalFund).toHaveBeenCalledTimes(1);
    expect(onSelectFutureCapitalFund).toHaveBeenCalledWith(null);
    onSelectFutureCapitalFund.mockClear();

    selectRadioAtIndex(1);
    expect(onSelectFutureCapitalFund).toHaveBeenCalledTimes(1);
    expect(onSelectFutureCapitalFund).toHaveBeenCalledWith('BBB');
    onSelectFutureCapitalFund.mockClear();
  });

  describe('When user selected to not transfer future contributions to Tuleva', () => {
    it('show selected radio title in bold', () => {
      const targetFunds = [
        { isin: 'AAA', name: 'A', fundManager: { name: 'Tuleva' } },
        { isin: 'BBB', name: 'B', fundManager: { name: 'Tuleva' } },
        { isin: 'CCC', name: 'C', fundManager: { name: 'some random bank' } },
      ];
      const loadingTargetFunds = false;
      component.setProps({
        targetFunds,
        loadingTargetFunds,
        selectedFutureContributionsFundIsin: null,
      });

      const radioAtIndexSelected = index =>
        component
          .find(Radio)
          .at(index)
          .prop('selected');
      expect(radioAtIndexSelected(2)).toBe(true);

      const noFutureConributionsTitleInBold = () =>
        component
          .find(Radio)
          .at(2)
          .find('p')
          .hasClass('text-bold');

      expect(noFutureConributionsTitleInBold()).toBe(true);

      component.setProps({
        targetFunds,
        loadingTargetFunds,
        selectedFutureContributionsFundIsin: 'AAA',
      });
      expect(noFutureConributionsTitleInBold()).toBe(false);
    });

    it('shows active fund note only if user has active fund', () => {
      let activeSourceFund = {
        isin: 'AAA',
        name: 'bla',
        managementFeePercent: 0.5,
      };
      const targetFunds = [{ isin: 'AAA', name: 'A' }, { isin: 'BBB', name: 'B' }];
      const loadingTargetFunds = false;
      const selectedFutureContributionsFundIsin = null;

      const activeFundMessage = (
        <Message
          params={{
            currentFundName: activeSourceFund.name,
            currentFundManagementFee: activeSourceFund.managementFeePercent,
          }}
        >
          transfer.future.capital.no.subtitle
        </Message>
      );

      component.setProps({
        targetFunds,
        loadingTargetFunds,
        selectedFutureContributionsFundIsin,
        activeSourceFund,
      });
      expect(component.contains(activeFundMessage)).toBe(true);

      activeSourceFund = null;
      component.setProps({
        targetFunds,
        loadingTargetFunds,
        selectedFutureContributionsFundIsin,
        activeSourceFund,
      });
      expect(component.contains(activeFundMessage)).toBe(false);
    });

    it('shows different active fund message for converted user', () => {
      let activeSourceFund = {
        isin: 'AAA',
        name: 'bla',
        managementFeePercent: 0.5,
      };
      const targetFunds = [{ isin: 'AAA', name: 'A' }, { isin: 'BBB', name: 'B' }];
      const loadingTargetFunds = false;
      const selectedFutureContributionsFundIsin = null;

      const activeFundMessage = (
        <Message
          params={{
            currentFundName: activeSourceFund.name,
            currentFundManagementFee: activeSourceFund.managementFeePercent,
          }}
        >
          transfer.future.capital.no.subtitle
        </Message>
      );

      component.setProps({
        targetFunds,
        loadingTargetFunds,
        selectedFutureContributionsFundIsin,
        activeSourceFund,
      });
      expect(component.contains(activeFundMessage)).toBe(true);

      activeSourceFund = null;
      component.setProps({
        targetFunds,
        loadingTargetFunds,
        selectedFutureContributionsFundIsin,
        activeSourceFund,
      });
      expect(component.contains(activeFundMessage)).toBe(false);
    });
  });

  it('has a sorted select options list for all funds', () => {
    const targetFunds = [
      { isin: 'AAA', name: 'A', fundManager: { name: 'Tuleva' } },
      { isin: 'CCC', name: 'C', fundManager: { name: 'Tuleva' } },
      { isin: 'BBB', name: 'B', fundManager: { name: 'some random bank' } },
    ];
    const loadingTargetFunds = false;
    component.setProps({ targetFunds, loadingTargetFunds });
    expect(
      component
        .find('option')
        .at(0)
        .prop('value'),
    ).toBe('1');
    expect(
      component
        .find('option')
        .at(1)
        .prop('value'),
    ).toBe('AAA');
    expect(
      component
        .find('option')
        .at(2)
        .prop('value'),
    ).toBe('BBB');
    expect(
      component
        .find('option')
        .at(3)
        .prop('value'),
    ).toBe('CCC');
    expect(component.find('option').length).toBe(4);
  });
});
