import { shallow } from 'enzyme';

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
    component.setProps({ targetFunds, isSelected: jest.fn() });
    expect(component.find('button').length).toBe(3);
    targetFunds.forEach((fund, index) => {
      expect(component.contains(fund.name)).toBe(true);
      expect(component.find('a.tv-target-fund__terms-link').at(index).prop('href')).toEqual(
        `target.funds.${fund.isin}.terms.link`,
      );
    });
  });

  it('sets the active target fund as active', () => {
    const targetFunds = [{ isin: '123' }, { isin: '456' }, { isin: '789' }];
    const isSelected = (fund) => fund.isin === '456';
    component.setProps({ targetFunds, isSelected });
    expect(component.find('button').first().hasClass('tv-target-fund--active')).toBe(false);
    expect(component.find('button').at(1).hasClass('tv-target-fund--active')).toBe(true);
    expect(component.find('button').last().hasClass('tv-target-fund--active')).toBe(false);
  });

  it('can select a target fund', () => {
    const onSelectFund = jest.fn();
    const targetFunds = [{ isin: '123' }, { isin: '456' }, { isin: '789' }];
    component.setProps({ targetFunds, onSelectFund, isSelected: jest.fn() });
    expect(onSelectFund).not.toHaveBeenCalled();
    component.find('button').last().simulate('click');
    expect(onSelectFund).toHaveBeenCalledTimes(1);
    expect(onSelectFund).toHaveBeenCalledWith(targetFunds[2]);
  });

  it('has terms links for every fund', () => {
    const targetFunds = [{ isin: '123' }, { isin: '456' }];
    component.setProps({ targetFunds, onSelectFund: jest.fn(), isSelected: jest.fn() });

    expect(component.find('a.tv-target-fund__terms-link').at(0).prop('href')).toEqual(
      'target.funds.123.terms.link',
    );
    expect(component.find('a.tv-target-fund__terms-link').at(1).prop('href')).toEqual(
      'target.funds.456.terms.link',
    );
  });
});
