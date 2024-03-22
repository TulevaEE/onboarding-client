import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { FormattedMessage } from 'react-intl';

import { INCEPTION, ReturnComparison } from './ReturnComparison';
import { getReturnComparison, Key, ReturnComparison as ReturnComparisonType } from './api';
import Select from './select';
import { initializeConfiguration } from '../../config/config';
import { getAuthentication } from '../../common/authenticationManager';
import { anAuthenticationManager } from '../../common/authenticationManagerFixture';
import { Fund } from '../../common/apiModels';

jest.mock('./api', () => ({
  ...jest.requireActual('./api'),
  getReturnComparison: jest.fn(),
}));

jest.mock('moment', () => {
  const actualMoment = jest.requireActual('moment');

  const mockedMoment = (...args: any[]) => {
    if (args.length === 0) {
      return actualMoment('2020-01-01T00:00:00.000Z');
    }
    return actualMoment(...args);
  };

  mockedMoment.locale = (lang: any) => {
    return lang || 'en';
  };

  mockedMoment.format = (...args: any[]) => actualMoment().format(...args);

  // eslint-disable-next-line fp/no-mutating-assign
  Object.assign(mockedMoment, actualMoment);

  return mockedMoment;
});

describe('Return comparison', () => {
  it('does not get returns when no token', () => {
    initializeConfiguration();
    shallow(
      <ReturnComparison
        secondPillarFunds={[]}
        thirdPillarFunds={[]}
        secondPillarOpenDate=""
        thirdPillarInitDate=""
      />,
    );
    expect(getReturnComparison).not.toHaveBeenCalled();
  });

  it('gets returns since inception for second pillar, default fund, and union stock index with token', () => {
    expect(getReturnComparison).not.toHaveBeenCalled();
    getAuthentication().update(anAuthenticationManager());
    shallow(
      <ReturnComparison
        secondPillarFunds={[]}
        thirdPillarFunds={[]}
        secondPillarOpenDate=""
        thirdPillarInitDate=""
      />,
    );
    expect(getReturnComparison).toHaveBeenCalledWith(INCEPTION, {
      personalKey: Key.SECOND_PILLAR,
      pensionFundKey: 'EE3600109435',
      indexKey: Key.UNION_STOCK_INDEX,
    });
  });

  it('gets returns on date change with date', async () => {
    (getReturnComparison as jest.Mock).mockResolvedValueOnce({});
    const component = shallow(
      <ReturnComparison
        secondPillarFunds={[]}
        thirdPillarFunds={[]}
        secondPillarOpenDate=""
        thirdPillarInitDate=""
      />,
    );

    await flushPromises();
    (getReturnComparison as jest.Mock).mockClear();
    expect(getReturnComparison).not.toHaveBeenCalled();

    dateSelect(component).simulate('change', '2020-06-25');
    expect(getReturnComparison).toHaveBeenCalledWith('2020-06-25', expect.any(Object));
  });

  it('gets returns on personal pillar change with pillar, with refreshed fund key', async () => {
    (getReturnComparison as jest.Mock).mockResolvedValueOnce({});

    const thirdPillarFunds = [{ isin: 'EE3600001707', name: 'Some fund' }] as Fund[];
    const component = shallow(
      <ReturnComparison
        secondPillarFunds={[]}
        thirdPillarFunds={thirdPillarFunds}
        secondPillarOpenDate=""
        thirdPillarInitDate=""
      />,
    );

    await flushPromises();
    (getReturnComparison as jest.Mock).mockClear();
    expect(getReturnComparison).not.toHaveBeenCalled();

    personalReturnSelect(component).simulate('change', Key.THIRD_PILLAR);
    expect(getReturnComparison).toHaveBeenCalledWith(expect.any(String), {
      personalKey: Key.THIRD_PILLAR,
      pensionFundKey: 'EE3600001707',
      indexKey: expect.any(String),
    });
  });

  it('gets returns on pension fund change with key', async () => {
    const component = shallow(
      <ReturnComparison
        secondPillarFunds={[]}
        thirdPillarFunds={[]}
        secondPillarOpenDate=""
        thirdPillarInitDate=""
      />,
    );
    await flushPromises();
    (getReturnComparison as jest.Mock).mockClear();

    expect(getReturnComparison).not.toHaveBeenCalled();
    pensionFundSelect(component).simulate('change', 'EE987654');
    expect(getReturnComparison).toHaveBeenCalledWith(expect.any(String), {
      personalKey: expect.any(String),
      pensionFundKey: 'EE987654',
      indexKey: expect.any(String),
    });
  });

  it('gets returns on index change with key', async () => {
    const component = shallow(
      <ReturnComparison
        secondPillarFunds={[]}
        thirdPillarFunds={[]}
        secondPillarOpenDate=""
        thirdPillarInitDate=""
      />,
    );
    await flushPromises();
    (getReturnComparison as jest.Mock).mockClear();

    expect(getReturnComparison).not.toHaveBeenCalled();
    indexSelect(component).simulate('change', Key.CPI);
    expect(getReturnComparison).toHaveBeenCalledWith(expect.any(String), {
      personalKey: expect.any(String),
      pensionFundKey: expect.any(String),
      indexKey: Key.CPI,
    });
  });

  it('has transformed pension fund isins as pension fund select options', async () => {
    const funds = [
      { isin: 'EE987654', name: 'Existing fund name' },
      { isin: 'EE123456', name: 'Additional fund name' },
    ] as Fund[];

    const component = shallow(
      <ReturnComparison
        secondPillarFunds={funds}
        thirdPillarFunds={funds}
        secondPillarOpenDate=""
        thirdPillarInitDate=""
      />,
    );

    expect(pensionFundSelect(component).prop('options')).toEqual([
      { label: 'Additional fund name', value: 'EE123456', disabled: false },
      { label: 'Existing fund name', value: 'EE987654', disabled: false },
    ]);
  });

  it('does not display EPI when third pillar is selected', async () => {
    const funds = [{ isin: 'EE3600001707', name: 'Some fund' }] as Fund[];

    const component = shallow(
      <ReturnComparison
        secondPillarFunds={funds}
        thirdPillarFunds={funds}
        secondPillarOpenDate=""
        thirdPillarInitDate=""
      />,
    );

    expect(indexSelect(component).prop('options')).toEqual([
      { label: 'returnComparison.index.unionStockIndex', value: Key.UNION_STOCK_INDEX },
      { label: 'returnComparison.pensionFund', value: Key.EPI },
      { label: 'returnComparison.index.cpi', value: Key.CPI },
    ]);
    personalReturnSelect(component).simulate('change', Key.THIRD_PILLAR);
    expect(indexSelect(component).prop('options')).toEqual([
      { label: 'returnComparison.index.unionStockIndex', value: Key.UNION_STOCK_INDEX },
      { label: 'returnComparison.index.cpi', value: Key.CPI },
    ]);
  });

  it('shows returns as - after failed retrieval', async () => {
    (getReturnComparison as jest.Mock).mockResolvedValueOnce({});
    const component = shallow(
      <ReturnComparison
        secondPillarFunds={[]}
        thirdPillarFunds={[]}
        secondPillarOpenDate=""
        thirdPillarInitDate=""
      />,
    );

    await flushPromises();

    (getReturnComparison as jest.Mock).mockRejectedValueOnce({});
    dateSelect(component).simulate('change', aDate());
    await flushPromises();

    expect(personalReturn(component)).toBe('-');
    expect(indexReturn(component)).toBe('-');
    expect(pensionFundReturn(component)).toBe('-');
  });

  it('shows a loader for returns while getting returns', async () => {
    (getReturnComparison as jest.Mock).mockResolvedValueOnce({});
    const component = shallow(
      <ReturnComparison
        secondPillarFunds={[]}
        thirdPillarFunds={[]}
        secondPillarOpenDate=""
        thirdPillarInitDate=""
      />,
    );
    await flushPromises();

    (getReturnComparison as jest.Mock).mockResolvedValueOnce({});
    dateSelect(component).simulate('change', aDate());

    expect(personalReturn(component)).toBe('<Shimmer />');
    expect(indexReturn(component)).toEqual('<Shimmer />');
    expect(pensionFundReturn(component)).toBe('<Shimmer />');
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

    getAuthentication().update(anAuthenticationManager());
    (getReturnComparison as jest.Mock).mockResolvedValueOnce({});
    const component = shallow(
      <ReturnComparison
        secondPillarFunds={[]}
        thirdPillarFunds={[]}
        secondPillarOpenDate=""
        thirdPillarInitDate=""
      />,
    );
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
    const component = shallow(
      <ReturnComparison
        secondPillarFunds={[]}
        thirdPillarFunds={[]}
        secondPillarOpenDate=""
        thirdPillarInitDate=""
      />,
    );

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

  it('gets returns since inception by default', async () => {
    (getReturnComparison as jest.Mock).mockResolvedValueOnce({});

    const component = shallow(
      <ReturnComparison
        secondPillarFunds={[]}
        thirdPillarFunds={[]}
        secondPillarOpenDate=""
        thirdPillarInitDate=""
      />,
    );
    await flushPromises();

    expect(dateSelect(component).prop('selected')).toEqual(INCEPTION);
  });

  it('updates pension fund options based on selected personal key', async () => {
    const secondPillarFunds = [{ isin: 'SP-123456', name: 'Second Pillar Fund 1' }] as Fund[];
    const thirdPillarFunds = [{ isin: 'TP-654321', name: 'Third Pillar Fund 1' }] as Fund[];

    const component = shallow(
      <ReturnComparison
        secondPillarFunds={secondPillarFunds}
        thirdPillarFunds={thirdPillarFunds}
        secondPillarOpenDate=""
        thirdPillarInitDate=""
      />,
    );

    component.setState({ selectedPersonalKey: Key.SECOND_PILLAR });
    await flushPromises();
    let selectOptions = pensionFundSelect(component).prop('options');
    expect(selectOptions).toContainEqual(expect.objectContaining({ value: 'SP-123456' }));
    expect(selectOptions).not.toContainEqual(expect.objectContaining({ value: 'TP-654321' }));

    component.setState({ selectedPersonalKey: Key.THIRD_PILLAR });
    await flushPromises();
    selectOptions = pensionFundSelect(component).prop('options');
    expect(selectOptions).toContainEqual(expect.objectContaining({ value: 'TP-654321' }));
    expect(selectOptions).not.toContainEqual(expect.objectContaining({ value: 'SP-123456' }));
  });

  const select = (c: ShallowWrapper) => c.find(Select);
  const dateSelect = (c: ShallowWrapper) => select(c).at(0);
  const personalReturnSelect = (c: ShallowWrapper) => select(c).at(1);
  const indexSelect = (c: ShallowWrapper) => select(c).at(2);
  const pensionFundSelect = (c: ShallowWrapper) => select(c).at(3);
  const aDate = (): string => '2020-06-25';

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
