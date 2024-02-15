import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { FormattedMessage } from 'react-intl';

import { ReturnComparison, START_DATE } from './ReturnComparison';
import { getReturnComparison, Key, ReturnComparison as ReturnComparisonType } from './api';
import Select from './select';

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
    shallow(<ReturnComparison token="" fundNameMapSecondPillar={{}} fundNameMapThirdPillar={{}} />);
    expect(getReturnComparison).not.toHaveBeenCalled();
  });

  it('gets returns from the beginning for second pillar, epi, and union stock index with token', () => {
    expect(getReturnComparison).not.toHaveBeenCalled();
    shallow(
      <ReturnComparison token="a-token" fundNameMapSecondPillar={{}} fundNameMapThirdPillar={{}} />,
    );
    expect(getReturnComparison).toHaveBeenCalledWith(
      START_DATE,
      { personalKey: Key.SECOND_PILLAR, pensionFundKey: Key.EPI, indexKey: Key.UNION_STOCK_INDEX },
      'a-token',
    );
  });

  it('gets returns on date change with date', async () => {
    (getReturnComparison as jest.Mock).mockResolvedValueOnce({});
    const component = shallow(
      <ReturnComparison token="a-token" fundNameMapSecondPillar={{}} fundNameMapThirdPillar={{}} />,
    );

    await flushPromises();
    (getReturnComparison as jest.Mock).mockClear();
    expect(getReturnComparison).not.toHaveBeenCalled();

    dateSelect(component).simulate('change', '2020-06-25');
    expect(getReturnComparison).toHaveBeenCalledWith('2020-06-25', expect.any(Object), 'a-token');
  });

  it('gets returns on personal pillar change with pillar, with refreshed fund key', async () => {
    (getReturnComparison as jest.Mock).mockResolvedValueOnce({});

    const fundNameMapThirdPillar = { thirdPillarFund1: 'Some fund' };
    const component = shallow(
      <ReturnComparison
        token="a-token"
        fundNameMapSecondPillar={{}}
        fundNameMapThirdPillar={fundNameMapThirdPillar}
      />,
    );

    await flushPromises();
    (getReturnComparison as jest.Mock).mockClear();
    expect(getReturnComparison).not.toHaveBeenCalled();

    personalReturnSelect(component).simulate('change', Key.THIRD_PILLAR);
    expect(getReturnComparison).toHaveBeenCalledWith(
      expect.any(String),
      {
        personalKey: Key.THIRD_PILLAR,
        pensionFundKey: 'thirdPillarFund1',
        indexKey: expect.any(String),
      },
      'a-token',
    );
  });

  it('gets returns on pension fund change with key', async () => {
    const component = shallow(
      <ReturnComparison token="a-token" fundNameMapSecondPillar={{}} fundNameMapThirdPillar={{}} />,
    );
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
    const component = shallow(
      <ReturnComparison token="a-token" fundNameMapSecondPillar={{}} fundNameMapThirdPillar={{}} />,
    );
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
      EE123456: 'Additional fund name',
    };

    const component = shallow(
      <ReturnComparison
        token={aToken()}
        fundNameMapSecondPillar={fundNameMap}
        fundNameMapThirdPillar={fundNameMap}
      />,
    );

    expect(pensionFundSelect(component).prop('options')).toEqual([
      { label: 'returnComparison.pensionFund', value: Key.EPI },
      { label: 'Additional fund name', value: 'EE123456' },
      { label: 'Existing fund name', value: 'EE987654' },
    ]);
  });

  it('does not display EPI in funds when third pillar is selected', async () => {
    const fundNameMap = {
      EE987654: 'Existing fund name',
      EE123456: 'Additional fund name',
    };

    const component = shallow(
      <ReturnComparison
        token={aToken()}
        fundNameMapSecondPillar={fundNameMap}
        fundNameMapThirdPillar={fundNameMap}
      />,
    );

    expect(pensionFundSelect(component).prop('options')).toEqual([
      { label: 'returnComparison.pensionFund', value: Key.EPI },
      { label: 'Additional fund name', value: 'EE123456' },
      { label: 'Existing fund name', value: 'EE987654' },
    ]);
    personalReturnSelect(component).simulate('change', Key.THIRD_PILLAR);
    expect(pensionFundSelect(component).prop('options')).toEqual([
      { label: 'Additional fund name', value: 'EE123456' },
      { label: 'Existing fund name', value: 'EE987654' },
    ]);
  });

  it('shows returns as - after failed retrieval', async () => {
    (getReturnComparison as jest.Mock).mockResolvedValueOnce({});
    const component = shallow(
      <ReturnComparison
        token={aToken()}
        fundNameMapSecondPillar={{}}
        fundNameMapThirdPillar={{}}
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
        token={aToken()}
        fundNameMapSecondPillar={{}}
        fundNameMapThirdPillar={{}}
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

    (getReturnComparison as jest.Mock).mockResolvedValueOnce({});
    const component = shallow(
      <ReturnComparison
        token={aToken()}
        fundNameMapSecondPillar={{}}
        fundNameMapThirdPillar={{}}
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
        token={aToken()}
        fundNameMapSecondPillar={{}}
        fundNameMapThirdPillar={{}}
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

  it('gets returns from the beginning by default', async () => {
    (getReturnComparison as jest.Mock).mockResolvedValueOnce({});

    const component = shallow(
      <ReturnComparison
        token={aToken()}
        fundNameMapSecondPillar={{}}
        fundNameMapThirdPillar={{}}
      />,
    );
    await flushPromises();

    expect(dateSelect(component).prop('selected')).toEqual(START_DATE);
  });

  it('updates pension fund options based on selected personal key', async () => {
    const secondPillarFundMap = {
      'SP-123456': 'Second Pillar Fund 1',
    };
    const thirdPillarFundMap = {
      'TP-654321': 'Third Pillar Fund 1',
    };

    const component = shallow(
      <ReturnComparison
        token={aToken()}
        fundNameMapSecondPillar={secondPillarFundMap}
        fundNameMapThirdPillar={thirdPillarFundMap}
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
