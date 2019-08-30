import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';

import ReturnComparison from '.';
import { Loader } from '../../common';
import { getReturnComparison } from './api';
import getFromDateOptions from './options';
import Select from './Select';

jest.mock('./api', () => ({
  getReturnComparison: jest.fn(),
}));
jest.mock('./options', () => jest.fn());

describe('Return comparison', () => {
  it('does not get returns when no token', () => {
    (getFromDateOptions as jest.Mock).mockReturnValue(someReturnComparisonOptions());
    shallow(<ReturnComparison token={undefined} />);
    expect(getReturnComparison).not.toHaveBeenCalled();
  });

  it('gets returns for first option date with token', () => {
    (getFromDateOptions as jest.Mock).mockReturnValue([
      { value: '2002-28-02', label: aLabel() },
      ...someReturnComparisonOptions(),
    ]);

    expect(getReturnComparison).not.toHaveBeenCalled();
    shallow(<ReturnComparison token="a-token" />);
    expect(getReturnComparison).toHaveBeenCalledWith('2002-28-02', 'a-token');
  });

  it('gets returns on date change with date', async () => {
    (getFromDateOptions as jest.Mock).mockReturnValue(someReturnComparisonOptions());
    (getReturnComparison as jest.Mock).mockResolvedValueOnce({});
    const component = shallow(<ReturnComparison token="a-token" />);

    await flushPromises();
    (getReturnComparison as jest.Mock).mockClear();
    expect(getReturnComparison).not.toHaveBeenCalled();

    select(component).simulate('change', '2020-06-25');
    expect(getReturnComparison).toHaveBeenCalledWith('2020-06-25', 'a-token');
  });

  it('shows returns as - after failed retrieval', async () => {
    (getFromDateOptions as jest.Mock).mockReturnValue(someReturnComparisonOptions());
    (getReturnComparison as jest.Mock).mockResolvedValueOnce({});
    const component = shallow(<ReturnComparison token={aToken()} />);

    await flushPromises();

    (getReturnComparison as jest.Mock).mockRejectedValueOnce({});
    select(component).simulate('change', aDate());
    await flushPromises();

    expect(personalReturn(component)).toBe('-');
    expect(pensionFundReturn(component)).toBe('-');
    expect(indexReturn(component)).toBe('-');
  });

  it('shows loader while getting returns', async () => {
    (getFromDateOptions as jest.Mock).mockReturnValue(someReturnComparisonOptions());
    (getReturnComparison as jest.Mock).mockResolvedValueOnce({});
    const component = shallow(<ReturnComparison token={aToken()} />);
    await flushPromises();

    (getReturnComparison as jest.Mock).mockResolvedValueOnce({});
    select(component).simulate('change', aDate());

    expect(loader(component).exists()).toBe(true);
    await flushPromises();
    expect(loader(component).exists()).toBe(false);
  });

  it('passes first from date to select by default', async () => {
    (getFromDateOptions as jest.Mock).mockReturnValue([
      { value: '2002-01-01', label: aLabel() },
      ...someReturnComparisonOptions(),
    ]);
    (getReturnComparison as jest.Mock).mockResolvedValueOnce({});

    const component = shallow(<ReturnComparison token={aToken()} />);
    await flushPromises();

    expect(select(component).prop('selected')).toEqual('2002-01-01');
  });

  const loader = (c): ShallowWrapper<any> => c.find(Loader);
  const select = (c): ShallowWrapper => c.find(Select);
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
