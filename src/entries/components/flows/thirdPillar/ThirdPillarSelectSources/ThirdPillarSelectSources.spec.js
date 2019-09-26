import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import { Loader, Radio, ErrorMessage } from '../../../common';
import PensionFundTable from '../../secondPillar/selectSources/pensionFundTable';
import TargetFundSelector from '../../secondPillar/selectSources/targetFundSelector';
import { ThirdPillarSelectSources } from './ThirdPillarSelectSources';

describe('Third pillar select sources step', () => {
  let component;

  beforeEach(() => {
    component = shallow(<ThirdPillarSelectSources />);
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
    });
    expect(component.get(0)).not.toEqual(<Loader className="align-middle" />);
  });

  it('renders a title', () => {
    expect(component.contains(<Message>thirdPillarFlowSelectSources.title</Message>)).toBe(true);
  });

  it('renders a pension fund table with given funds', () => {
    const sourceFunds = [{ iAmAFund: true }, { iAmAlsoAFund: true }];
    component.setProps({ sourceFunds });
    expect(component.contains(<PensionFundTable funds={sourceFunds} />)).toBe(true);
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

  it('passes the recommended fund isin forward to the target fund selector', () => {
    const recommendedFundIsin = 'asd';
    component.setProps({
      exchangeExistingUnits: true,
      futureContributionsFundIsin: 'EE123',
      recommendedFundIsin,
    });
    expect(component.find(TargetFundSelector).prop('recommendedFundIsin')).toBe(
      recommendedFundIsin,
    );
  });

  it('renders error', () => {
    const error = { body: 'aww no' };
    const funds = [{ aFund: true }];

    component.setProps({ error, funds });

    expect(component.contains(<ErrorMessage errors={error.body} />)).toBe(true);
    expect(component.contains(<Loader className="align-middle" />)).toBe(false);
    expect(component.contains(<PensionFundTable funds={funds} />)).toBe(false);
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
