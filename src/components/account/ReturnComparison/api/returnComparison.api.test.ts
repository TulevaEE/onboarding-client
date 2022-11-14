import { getReturnComparison } from '.';
import { get } from '../../../common/http';
import { getEndpoint } from '../../../common/api';
import { Key } from './returnComparison.api';

jest.mock('../../../common/http', () => ({ get: jest.fn() }));
jest.mock('../../../common/api', () => ({ getEndpoint: jest.fn() }));

describe('Return comparison API', () => {
  it('calls the transformed returns endpoint with date and keys as params and token in header', async () => {
    (getEndpoint as jest.Mock).mockImplementationOnce((url) => `/transformed${url}`);
    (get as jest.Mock).mockResolvedValueOnce({ returns: [] });

    expect(get).not.toHaveBeenCalled();
    await getReturnComparison(
      '2019-02-28',
      { personalKey: Key.THIRD_PILLAR, pensionFundKey: 'EE12345', indexKey: Key.CPI },
      'a-token',
    );
    expect(get).toHaveBeenCalledWith(
      '/transformed/v1/returns',
      { from: '2019-02-28', keys: [Key.THIRD_PILLAR, 'EE12345', Key.CPI] },
      { Authorization: 'Bearer a-token' },
    );
  });

  it('returns return comparison object with passed personal pillar, pension fund, and index values', async () => {
    (get as jest.Mock).mockResolvedValueOnce({
      from: '',
      notEnoughHistory: false,
      returns: [
        { key: Key.CPI, rate: 0.0686, amount: 224.23 },
        { key: 'EE123456', rate: 0.0228, amount: 883.45 },
        { key: Key.THIRD_PILLAR, rate: 0.0436, amount: 997.12 },
      ],
    });

    const comparison = await getReturnComparison(
      '',
      { personalKey: Key.THIRD_PILLAR, pensionFundKey: 'EE123456', indexKey: Key.CPI },
      '',
    );
    expect(comparison).toStrictEqual({
      personal: { rate: 0.0436, amount: 997.12 },
      pensionFund: { rate: 0.0228, amount: 883.45 },
      index: { rate: 0.0686, amount: 224.23 },
      notEnoughHistory: false,
    });
  });

  it('returns return comparison object with null values when respective keys are not found', async () => {
    (get as jest.Mock).mockResolvedValueOnce({
      from: '',
      notEnoughHistory: false,
      returns: [{ key: 'EPI', rate: 0.0228, amount: 220.204 }],
    });

    const comparison = await getReturnComparison(
      '',
      { personalKey: Key.THIRD_PILLAR, pensionFundKey: Key.EPI, indexKey: Key.CPI },
      '',
    );
    expect(comparison).toStrictEqual({
      notEnoughHistory: false,
      personal: null,
      pensionFund: { rate: 0.0228, amount: 220.204 },
      index: null,
    });
  });

  it('returns return comparison object with null values when there is not enough history', async () => {
    (get as jest.Mock).mockResolvedValueOnce({
      from: '',
      notEnoughHistory: true,
      returns: null,
    });

    const comparison = await getReturnComparison(
      '',
      { personalKey: Key.THIRD_PILLAR, pensionFundKey: Key.EPI, indexKey: Key.CPI },
      '',
    );
    expect(comparison).toStrictEqual({
      notEnoughHistory: true,
      personal: null,
      pensionFund: null,
      index: null,
    });
  });
});
