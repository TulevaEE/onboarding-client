import React from 'react';
import { shallow } from 'enzyme';

import { FormattedMessage, FormattedRelativeTime } from 'react-intl';
import { TargetFundSelector } from './TargetFundSelector';

jest.mock('react-intl', () => ({
  useIntl: () => ({
    formatMessage: ({ id }) => id,
  }),
}));

describe('Target fund selector', () => {
  let component;

  beforeEach(() => {
    const props = { translations: { translate: (key) => key } };
    component = shallow(<TargetFundSelector {...props} />);
  });

  it('renders a target fund selector button for every target fund', () => {
    const targetFunds = [
      { isin: '123', name: 'A' },
      { isin: '456', name: 'B' },
      { isin: '789', name: 'C' },
    ];
    component.setProps({ targetFunds });
    expect(component.find('button').length).toBe(3);
    targetFunds.forEach((fund) => {
      expect(component.contains(fund.name)).toBe(true);
      expect(
        component.contains(<FormattedMessage id={`target.funds.${fund.isin}.description`} />),
      ).toBe(true);
      // TODO: add test for terms link once we have the links.
    });
  });

  it('sets the active target fund as active', () => {
    const selectedTargetFundIsin = '456';
    const targetFunds = [{ isin: '123' }, { isin: '456' }, { isin: '789' }];
    component.setProps({ targetFunds, selectedTargetFundIsin });
    expect(component.find('button').first().hasClass('tv-target-fund--active')).toBe(false);
    expect(component.find('button').at(1).hasClass('tv-target-fund--active')).toBe(true);
    expect(component.find('button').last().hasClass('tv-target-fund--active')).toBe(false);
  });

  it('can select a target fund', () => {
    const onSelectFund = jest.fn();
    const targetFunds = [{ isin: '123' }, { isin: '456' }, { isin: '789' }];
    component.setProps({ targetFunds, onSelectFund });
    expect(onSelectFund).not.toHaveBeenCalled();
    component.find('button').last().simulate('click');
    expect(onSelectFund).toHaveBeenCalledTimes(1);
    expect(onSelectFund).toHaveBeenCalledWith(targetFunds[2]);
  });

  it('shows that the recommended fund is recommended', () => {
    const targetFunds = [{ isin: '123' }, { isin: '456' }, { isin: '789' }];
    let recommendedFundIsin = '456';
    component.setProps({ targetFunds, recommendedFundIsin });
    expect(
      component.contains(<FormattedMessage id="select.sources.select.all.recommended" />),
    ).toBe(true);

    recommendedFundIsin = '555';
    component.setProps({ targetFunds, recommendedFundIsin });
    expect(
      component.contains(<FormattedMessage id="select.sources.select.all.recommended" />),
    ).toBe(false);
  });

  it('has terms links for every fund', () => {
    const onSelectFund = jest.fn();
    const targetFunds = [{ isin: '123' }, { isin: '456' }];
    component.setProps({ targetFunds, onSelectFund });

    expect(component.find('a.tv-target-fund__terms-link').at(0).prop('href')).toEqual(
      'target.funds.123.terms.link',
    );
    expect(component.find('a.tv-target-fund__terms-link').at(1).prop('href')).toEqual(
      'target.funds.456.terms.link',
    );
  });
});
