import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import { Loader, Radio } from '../../../common';
import PensionFundTable from '../../secondPillar/selectSources/pensionFundTable';
import TargetFundSelector from '../../secondPillar/selectSources/targetFundSelector';
import { ThirdPillarSelectSources } from './ThirdPillarSelectSources';

describe('Third pillar select sources step', () => {
  let component;

  beforeEach(() => {
    component = shallow(<ThirdPillarSelectSources />);
  });

  it('renders a title', () => {
    expect(component.contains(<Message>thirdPillarFlowSelectSources.title</Message>)).toBe(true);
  });

  it('renders a loader when no source funds available', () => {
    component.setProps({ loadingSourceFunds: false, sourceFunds: [] });
    expect(component.contains(<Loader className="align-middle" />)).toBe(true);

    component.setProps({ loadingSourceFunds: true, sourceFunds: [] });
    expect(component.contains(<Loader className="align-middle" />)).toBe(true);

    component.setProps({ loadingSourceFunds: false, sourceFunds: [{ fund: true }] });
    expect(component.contains(<Loader className="align-middle" />)).toBe(false);
  });

  it('renders a pension fund table with given funds', () => {
    const exchangeableSourceFunds = [{ iAmAFund: true }, { iAmAlsoAFund: true }];
    component.setProps({ exchangeableSourceFunds });
    expect(component.contains(<PensionFundTable funds={exchangeableSourceFunds} />)).toBe(true);
  });

  it('sets the full selection radio as selected only when all funds selected', () => {
    const fullSelectionRadio = () => component.find(Radio).first();
    component.setProps({
      exchangeExistingUnits: true,
      futureContributionsFundIsin: 'EE123',
    });
    expect(fullSelectionRadio().prop('selected')).toBe(true);

    component.setProps({ exchangeExistingUnits: false, futureContributionsFundIsin: 'EE123' });
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
    component
      .find(Radio)
      .first()
      .simulate('select');
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(true, 'EE123');
  });

  it('renders a loader when no target funds available', () => {
    component.setProps({
      exchangeExistingUnits: true,
      futureContributionsFundIsin: 'EE123',
      loadingTargetFunds: false,
      targetFunds: [],
    });
    expect(component.contains(<Loader className="align-middle mt-4" />)).toBe(true);

    component.setProps({
      exchangeExistingUnits: true,
      futureContributionsFundIsin: 'EE123',
      loadingTargetFunds: true,
      targetFunds: [],
    });
    expect(component.contains(<Loader className="align-middle mt-4" />)).toBe(true);

    component.setProps({
      exchangeExistingUnits: true,
      futureContributionsFundIsin: 'EE123',
      loadingTargetFunds: false,
      targetFunds: [{ fund: true }],
    });
    expect(component.contains(<Loader className="align-middle mt-4" />)).toBe(false);
  });

  it('passes the recommended fund isin forward to the target fund selector', () => {
    const recommendedFundIsin = 'asd';
    component.setProps({
      exchangeExistingUnits: true,
      futureContributionsFundIsin: 'EE123',
      recommendedFundIsin,
      targetFunds: [{ fund: true }],
    });
    expect(component.find(TargetFundSelector).prop('recommendedFundIsin')).toBe(
      recommendedFundIsin,
    );
  });

  it('renders info about cost and reference link', () => {
    component.setProps({
      exchangeExistingUnits: true,
      futureContributionsFundIsin: 'EE123',
    });
    expect(
      component.contains(
        <a
          href="//www.pensionikeskus.ee/iii-sammas/vabatahtlikud-pensionifondid/fonditasude-vordlus-pensioni-iii-sammas/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Message>thirdPillarFlowSelectSources.cost</Message>
        </a>,
      ),
    ).toBe(true);
  });
});
