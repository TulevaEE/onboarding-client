import { getReturnComparison } from '.';
import { getWithAuthentication } from '../../../common/http';
import { getEndpoint } from '../../../common/api';
import { Key } from './returnComparison.api';

jest.mock('../../../common/api', () => ({ getEndpoint: jest.fn() }));

jest.mock('../../../common/http', () => ({
  getWithAuthentication: jest.fn(),
}));

describe('Return comparison API', () => {
  it('calls the transformed returns endpoint with date and keys as params and token in header', async () => {
    (getEndpoint as jest.Mock).mockImplementationOnce((url) => `/transformed${url}`);
    (getWithAuthentication as jest.Mock).mockResolvedValueOnce({ returns: [] });

    expect(getWithAuthentication).not.toHaveBeenCalled();
    await getReturnComparison(
      {
        personalKey: Key.THIRD_PILLAR,
        pensionFundKey: 'EE12345',
        indexKey: Key.CPI,
      },
      '2019-02-28',
    );
    expect(getWithAuthentication).toHaveBeenCalledWith('/transformed/v1/returns', {
      from: '2019-02-28',
      keys: [Key.THIRD_PILLAR, 'EE12345', Key.CPI],
    });
  });

  it('returns return comparison object with passed personal pillar, pension fund, and index values', async () => {
    const personalReturn = { key: Key.THIRD_PILLAR, rate: 0.0436, amount: 997.12, currency: 'EUR' };
    const fundReturn = { key: 'EE123456', rate: 0.0228, amount: 883.45, currency: 'EUR' };
    const indexReturn = { key: Key.CPI, rate: 0.0686, amount: 224.23, currency: 'EUR' };
    (getWithAuthentication as jest.Mock).mockResolvedValueOnce({
      returns: [indexReturn, fundReturn, personalReturn],
      from: '2020-01-01',
      to: '2025-01-01',
    });

    const comparison = await getReturnComparison(
      {
        personalKey: Key.THIRD_PILLAR,
        pensionFundKey: 'EE123456',
        indexKey: Key.CPI,
      },
      '',
    );
    expect(comparison).toStrictEqual({
      personal: personalReturn,
      pensionFund: fundReturn,
      index: indexReturn,
      from: '2020-01-01',
      to: '2025-01-01',
    });
  });

  it('returns return comparison object with null values when respective keys are not found', async () => {
    const fundReturn = { key: 'EPI', rate: 0.0228, amount: 220.204, currency: 'EUR' };
    (getWithAuthentication as jest.Mock).mockResolvedValueOnce({
      returns: [fundReturn],
      from: '',
      to: '',
    });

    const comparison = await getReturnComparison(
      {
        personalKey: Key.THIRD_PILLAR,
        pensionFundKey: Key.EPI,
        indexKey: Key.CPI,
      },
      '',
    );
    expect(comparison).toStrictEqual({
      from: '',
      to: '',
      personal: null,
      pensionFund: fundReturn,
      index: null,
    });
  });
});
