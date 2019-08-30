import { getReturnComparison } from '.';
import { get } from '../../../common/http';
import { getEndpoint } from '../../../common/api';
import { Key } from './returnComparison.api';

jest.mock('../../../common/http', () => ({ get: jest.fn() }));
jest.mock('../../../common/api', () => ({ getEndpoint: jest.fn() }));

describe('Return comparison API', () => {
  it('calls the transformed returns endpoint with date and keys as params and token in header', async () => {
    (getEndpoint as jest.Mock).mockImplementationOnce(url => `/transformed${url}`);
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
      returns: [
        { key: Key.CPI, value: 0.0686 },
        { key: 'EE123456', value: 0.0228 },
        { key: Key.THIRD_PILLAR, value: 0.0436 },
      ],
    });

    const comparison = await getReturnComparison(
      '',
      { personalKey: Key.THIRD_PILLAR, pensionFundKey: 'EE123456', indexKey: Key.CPI },
      '',
    );
    expect(comparison).toStrictEqual({
      personal: 0.0436,
      pensionFund: 0.0228,
      index: 0.0686,
    });
  });

  it('returns return comparison object with null values when respective keys are not found', async () => {
    (get as jest.Mock).mockResolvedValueOnce({
      from: '',
      returns: [{ key: 'EPI', value: 0.0228 }],
    });

    const comparison = await getReturnComparison(
      '',
      { personalKey: Key.THIRD_PILLAR, pensionFundKey: Key.EPI, indexKey: Key.CPI },
      '',
    );
    expect(comparison).toStrictEqual({
      personal: null,
      pensionFund: 0.0228,
      index: null,
    });
  });
});
