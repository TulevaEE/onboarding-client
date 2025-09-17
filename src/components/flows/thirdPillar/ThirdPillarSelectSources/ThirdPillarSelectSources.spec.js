import React from 'react';
import { shallow } from 'enzyme';

import { FormattedMessage } from 'react-intl';
import { Radio } from '../../../common';
import { ThirdPillarSelectSources } from './ThirdPillarSelectSources';
import AccountStatement from '../../../account/AccountStatement';
import { Shimmer } from '../../../common/shimmer/Shimmer';

describe('Third pillar select sources step', () => {
  let component;

  beforeEach(() => {
    component = shallow(<ThirdPillarSelectSources />);
  });

  it('renders a title', () => {
    expect(component.contains(<FormattedMessage id="thirdPillarFlowSelectSources.title" />)).toBe(
      true,
    );
  });

  it('renders a loader when no source funds available', () => {
    component.setProps({ loadingSourceFunds: true, exchangeableSourceFunds: [] });
    expect(component.contains(<Shimmer height={26} />)).toBe(true);

    component.setProps({
      loadingSourceFunds: false,
      exchangeableSourceFunds: [{ fund: true }],
    });
    expect(component.contains(<Shimmer height={26} />)).toBe(false);
  });

  it('renders a pension fund table with given funds', () => {
    const exchangeableSourceFunds = [{ iAmAFund: true }, { iAmAlsoAFund: true }];
    component.setProps({ exchangeableSourceFunds });
    expect(component.contains(<AccountStatement funds={exchangeableSourceFunds} />)).toBe(true);
  });

  it('sets the full selection radio as selected only when all funds selected', () => {
    const fullSelectionRadio = () => component.find(Radio).first();
    component.setProps({
      exchangeExistingUnits: true,
      futureContributionsFundIsin: 'EE123',
    });
    expect(fullSelectionRadio().prop('selected')).toBe(true);

    component.setProps({
      exchangeExistingUnits: false,
      futureContributionsFundIsin: 'EE123',
    });
    expect(fullSelectionRadio().prop('selected')).toBe(false);

    component.setProps({
      exchangeExistingUnits: false,
      futureContributionsFundIsin: '',
    });
    expect(fullSelectionRadio().prop('selected')).toBe(false);
  });

  it('selects all funds when clicking on the full selection radio', () => {
    const onSelect = jest.fn();
    const targetFunds = [{ isin: 'EE123', fundManager: { name: 'Tuleva' } }];
    component.setProps({ targetFunds, onSelect });
    expect(onSelect).not.toHaveBeenCalled();
    component.find(Radio).first().simulate('select');
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(true, 'EE123');
  });

  it('renders a shimmer when no target funds available', () => {
    component.setProps({
      exchangeExistingUnits: true,
      futureContributionsFundIsin: 'EE123',
      loadingTargetFunds: true,
      targetFunds: [],
    });
    expect(component.contains(<Shimmer height={26} />)).toBe(true);

    component.setProps({
      exchangeExistingUnits: true,
      futureContributionsFundIsin: 'EE123',
      loadingTargetFunds: false,
      targetFunds: [{ fund: true }],
    });
    expect(component.contains(<Shimmer height={26} />)).toBe(false);
  });
});
