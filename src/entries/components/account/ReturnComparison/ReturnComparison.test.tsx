import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';

import { ReturnComparison } from './ReturnComparison';
import { getReturnComparison, Key } from './api';
import getFromDateOptions from './options';
import Select from './Select';

jest.mock('./api', () => ({
  ...jest.requireActual('./api'),
  getReturnComparison: jest.fn(),
}));
jest.mock('./options', () => jest.fn());
jest.mock('./fundIsinsWithAvailableData.json', () => ['EE123456', 'EE987654']);

describe('Return comparison', () => {
  it('does not get returns when no token', () => {
    (getFromDateOptions as jest.Mock).mockReturnValue(someReturnComparisonOptions());
    shallow(<ReturnComparison token={undefined} fundNameMap={{}} />);
    expect(getReturnComparison).not.toHaveBeenCalled();
  });

  it('gets returns for first option date, second pillar, epi, and market with token', () => {
    (getFromDateOptions as jest.Mock).mockReturnValue([
      { value: '2002-28-02', label: aLabel() },
      ...someReturnComparisonOptions(),
    ]);

    expect(getReturnComparison).not.toHaveBeenCalled();
    shallow(<ReturnComparison token="a-token" fundNameMap={{}} />);
    expect(getReturnComparison).toHaveBeenCalledWith(
      '2002-28-02',
      { personalKey: Key.SECOND_PILLAR, pensionFundKey: Key.EPI, indexKey: Key.MARKET },
      'a-token',
    );
  });

  it('gets returns on date change with date', async () => {
    (getFromDateOptions as jest.Mock).mockReturnValue(someReturnComparisonOptions());
    (getReturnComparison as jest.Mock).mockResolvedValueOnce({});
    const component = shallow(<ReturnComparison token="a-token" fundNameMap={{}} />);

    await flushPromises();
    (getReturnComparison as jest.Mock).mockClear();
    expect(getReturnComparison).not.toHaveBeenCalled();

    dateSelect(component).simulate('change', '2020-06-25');
    expect(getReturnComparison).toHaveBeenCalledWith('2020-06-25', expect.any(Object), 'a-token');
  });

  it('gets returns on personal pillar change with pillar', async () => {
    (getFromDateOptions as jest.Mock).mockReturnValue(someReturnComparisonOptions());
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
    (getFromDateOptions as jest.Mock).mockReturnValue(someReturnComparisonOptions());
    (getReturnComparison as jest.Mock).mockResolvedValueOnce({});
    const component = shallow(<ReturnComparison token={aToken()} fundNameMap={{}} />);

    await flushPromises();

    (getReturnComparison as jest.Mock).mockRejectedValueOnce({});
    dateSelect(component).simulate('change', aDate());
    await flushPromises();

    expect(personalReturn(component)).toBe('-');
    expect(pensionFundReturn(component)).toBe('-');
    expect(indexReturn(component)).toBe('-');
  });

  it('shows ... for returns while getting returns', async () => {
    (getFromDateOptions as jest.Mock).mockReturnValue(someReturnComparisonOptions());
    (getReturnComparison as jest.Mock).mockResolvedValueOnce({});
    const component = shallow(<ReturnComparison token={aToken()} fundNameMap={{}} />);
    await flushPromises();

    (getReturnComparison as jest.Mock).mockResolvedValueOnce({});
    dateSelect(component).simulate('change', aDate());

    expect(personalReturn(component)).toBe('...');
    expect(pensionFundReturn(component)).toBe('...');
    expect(indexReturn(component)).toBe('...');
  });

  it('passes first from date to select by default', async () => {
    (getFromDateOptions as jest.Mock).mockReturnValue([
      { value: '2002-01-01', label: aLabel() },
      ...someReturnComparisonOptions(),
    ]);
    (getReturnComparison as jest.Mock).mockResolvedValueOnce({});

    const component = shallow(<ReturnComparison token={aToken()} fundNameMap={{}} />);
    await flushPromises();

    expect(dateSelect(component).prop('selected')).toEqual('2002-01-01');
  });

  const select = (c): ShallowWrapper => c.find(Select);
  const dateSelect = (c): ShallowWrapper => select(c).at(0);
  const personalReturnSelect = (c): ShallowWrapper => select(c).at(1);
  const pensionFundSelect = (c): ShallowWrapper => select(c).at(2);
  const indexSelect = (c): ShallowWrapper => select(c).at(3);
  const someReturnComparisonOptions = (): { value: string; label: string }[] => [
    { value: '2015-03-10', label: 'A date' },
    { value: '2020-10-03', label: 'Another date' },
  ];
  const aDate = (): string => '2020-06-25';
  const aToken = (): string => 'a-token';
  const aLabel = (): string => 'a label';
  const returns = (c, index): ShallowWrapper => c.find('.h2').at(index);
  const personalReturn = (c): string => returns(c, 0).text();
  const pensionFundReturn = (c): string => returns(c, 1).text();
  const indexReturn = (c): string => returns(c, 2).text();
  const flushPromises = (): Promise<any> =>
    new Promise((resolve): void => {
      process.nextTick((): void => {
        resolve();
      });
    });
});
