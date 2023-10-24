import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { FormattedMessage } from 'react-intl';

import { ReturnComparison } from './ReturnComparison';
import { getReturnComparison, Key, ReturnComparison as ReturnComparisonType } from './api';
import Select from './select';

jest.mock('./api', () => ({
  ...jest.requireActual('./api'),
  getReturnComparison: jest.fn(),
}));
jest.mock('moment', () => {
  return () => jest.requireActual('moment')('2020-01-01T00:00:00.000Z');
});
jest.mock('./fundIsinsWithAvailableData.json', () => ['EE123456', 'EE987654']);

describe('Return comparison', () => {
  it('does not get returns when no token', () => {
    shallow(<ReturnComparison token="" fundNameMap={{}} />);
    expect(getReturnComparison).not.toHaveBeenCalled();
  });

  it('gets returns for ten years ago, second pillar, epi, and union stock index with token', () => {
    expect(getReturnComparison).not.toHaveBeenCalled();
    shallow(<ReturnComparison token="a-token" fundNameMap={{}} />);
    expect(getReturnComparison).toHaveBeenCalledWith(
      '2010-01-01',
      { personalKey: Key.SECOND_PILLAR, pensionFundKey: Key.EPI, indexKey: Key.UNION_STOCK_INDEX },
      'a-token',
    );
  });

  it('gets returns on date change with date', async () => {
    (getReturnComparison as jest.Mock).mockResolvedValueOnce({});
    const component = shallow(<ReturnComparison token="a-token" fundNameMap={{}} />);

    await flushPromises();
    (getReturnComparison as jest.Mock).mockClear();
    expect(getReturnComparison).not.toHaveBeenCalled();

    dateSelect(component).simulate('change', '2020-06-25');
    expect(getReturnComparison).toHaveBeenCalledWith('2020-06-25', expect.any(Object), 'a-token');
  });

  it('gets returns on personal pillar change with pillar', async () => {
    (getReturnComparison as jest.Mock).mockResolvedValueOnce({});
    const component = shallow(<ReturnComparison token="a-token" fundNameMap={{}} />);

    await flushPromises();
    (getReturnComparison as jest.Mock).mockClear();
    expect(getReturnComparison).not.toHaveBeenCalled();

    personalReturnSelect(component).simulate('change', Key.THIRD_PILLAR);
    expect(getReturnComparison).toHaveBeenCalledWith(
      expect.any(String),
      {
        personalKey: Key.THIRD_PILLAR,
        pensionFundKey: expect.any(String),
        indexKey: expect.any(String),
      },
      'a-token',
    );
  });

  it('gets returns on pension fund change with key', async () => {
    const component = shallow(<ReturnComparison token="a-token" fundNameMap={{}} />);
    await flushPromises();
    (getReturnComparison as jest.Mock).mockClear();

    expect(getReturnComparison).not.toHaveBeenCalled();
    pensionFundSelect(component).simulate('change', 'EE987654');
    expect(getReturnComparison).toHaveBeenCalledWith(
      expect.any(String),
      {
        personalKey: expect.any(String),
        pensionFundKey: 'EE987654',
        indexKey: expect.any(String),
      },
      'a-token',
    );
  });

  it('gets returns on index change with key', async () => {
    const component = shallow(<ReturnComparison token="a-token" fundNameMap={{}} />);
    await flushPromises();
    (getReturnComparison as jest.Mock).mockClear();

    expect(getReturnComparison).not.toHaveBeenCalled();
    indexSelect(component).simulate('change', Key.CPI);
    expect(getReturnComparison).toHaveBeenCalledWith(
      expect.any(String),
      {
        personalKey: expect.any(String),
        pensionFundKey: expect.any(String),
        indexKey: Key.CPI,
      },
      'a-token',
    );
  });

  it('has transformed hardcoded pension fund isins and epi as pension fund select options', async () => {
    const fundNameMap = {
      EE987654: 'Existing fund name',
    };
    const component = shallow(<ReturnComparison token={aToken()} fundNameMap={fundNameMap} />);

    expect(pensionFundSelect(component).prop('options')).toEqual([
      { label: 'returnComparison.pensionFund', value: Key.EPI },
      { label: 'EE123456', value: 'EE123456' },
      { label: 'Existing fund name', value: 'EE987654' },
    ]);
  });

  it('shows returns as - after failed retrieval', async () => {
    (getReturnComparison as jest.Mock).mockResolvedValueOnce({});
    const component = shallow(<ReturnComparison token={aToken()} fundNameMap={{}} />);

    await flushPromises();

    (getReturnComparison as jest.Mock).mockRejectedValueOnce({});
    dateSelect(component).simulate('change', aDate());
    await flushPromises();

    expect(personalReturn(component)).toBe('-');
    expect(indexReturn(component)).toBe('-');
    expect(pensionFundReturn(component)).toBe('-');
  });

  it('shows ... for returns while getting returns', async () => {
    (getReturnComparison as jest.Mock).mockResolvedValueOnce({});
    const component = shallow(<ReturnComparison token={aToken()} fundNameMap={{}} />);
    await flushPromises();

    (getReturnComparison as jest.Mock).mockResolvedValueOnce({});
    dateSelect(component).simulate('change', aDate());

    expect(personalReturn(component)).toBe('...');
    expect(indexReturn(component)).toBe('...');
    expect(pensionFundReturn(component)).toBe('...');
  });

  it('shows returns as formatted percentages and no error messages', async () => {
    const returns: ReturnComparisonType = {
      personal: {
        key: Key.SECOND_PILLAR,
        type: 'PERSONAL',
        rate: 0.1,
        amount: 1000.1033,
        paymentsSum: 100.123,
        currency: 'EUR',
      },
      index: {
        key: Key.UNION_STOCK_INDEX,
        type: 'INDEX',
        rate: 0.122,
        amount: 1222.1232,
        paymentsSum: 200.234,
        currency: 'EUR',
      },
      pensionFund: {
        key: Key.THIRD_PILLAR,
        type: 'FUND',
        rate: 0.111,
        amount: 1111.0123,
        paymentsSum: 300.345,
        currency: 'EUR',
      },
      from: '2019-01-01',
    };

    (getReturnComparison as jest.Mock).mockResolvedValueOnce({});
    const component = shallow(<ReturnComparison token={aToken()} fundNameMap={{}} />);
    await flushPromises();

    (getReturnComparison as jest.Mock).mockResolvedValueOnce(returns);
    dateSelect(component).simulate('change', aDate());
    await flushPromises();

    expect(personalReturn(component)).toBe('10.0%');
    expect(indexReturn(component)).toBe('12.2%');
    expect(pensionFundReturn(component)).toBe('11.1%');
    expect(component.contains(<FormattedMessage id="returnComparison.notEnoughHistory" />)).toBe(
      false,
    );
  });

  it('shows an error message and returns as - after getting not enough history response', async () => {
    (getReturnComparison as jest.Mock).mockResolvedValueOnce({});
    const component = shallow(<ReturnComparison token={aToken()} fundNameMap={{}} />);

    await flushPromises();

    (getReturnComparison as jest.Mock).mockResolvedValueOnce({
      personal: null,
      index: null,
      pensionFund: null,
      from: '2020-01-01',
    });
    dateSelect(component).simulate('change', aDate());
    await flushPromises();

    expect(personalReturn(component)).toBe('-');
    expect(indexReturn(component)).toBe('-');
    expect(pensionFundReturn(component)).toBe('-');
    expect(component.contains(<FormattedMessage id="returnComparison.notEnoughHistory" />)).toBe(
      true,
    );
  });

  it('passes ten years ago select by default', async () => {
    (getReturnComparison as jest.Mock).mockResolvedValueOnce({});

    const component = shallow(<ReturnComparison token={aToken()} fundNameMap={{}} />);
    await flushPromises();

    expect(dateSelect(component).prop('selected')).toEqual('2010-01-01');
  });

  const select = (c: ShallowWrapper) => c.find(Select);
  const dateSelect = (c: ShallowWrapper) => select(c).at(0);
  const personalReturnSelect = (c: ShallowWrapper) => select(c).at(1);
  const indexSelect = (c: ShallowWrapper) => select(c).at(2);
  const pensionFundSelect = (c: ShallowWrapper) => select(c).at(3);
  const aDate = (): string => '2020-06-25';
  const aToken = (): string => 'a-token';
  const returns = (c: ShallowWrapper, index: number) => c.find('.h2').at(index);
  const personalReturn = (c: ShallowWrapper): string => returns(c, 0).text();
  const indexReturn = (c: ShallowWrapper): string => returns(c, 1).text();
  const pensionFundReturn = (c: ShallowWrapper): string => returns(c, 2).text();
  const flushPromises = (): Promise<any> =>
    new Promise((resolve): void => {
      process.nextTick((): void => {
        resolve('');
      });
    });
});
