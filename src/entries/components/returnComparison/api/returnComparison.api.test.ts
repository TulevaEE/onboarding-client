import { getReturnComparison } from '.';
import { get } from '../../common/http';

jest.mock('../../common/http', () => ({
  get: jest.fn(),
}));

describe('Return comparison API', () => {
  it('calls the returns endpoint with date as param and token in header', async () => {
    (get as jest.Mock).mockResolvedValueOnce({ returns: [] });

    expect(get).not.toHaveBeenCalled();
    await getReturnComparison('2019-02-28', 'a-token');
    expect(get).toHaveBeenCalledWith(
      '/v1/returns',
      { from: '2019-02-28' },
      { Authorization: 'Bearer a-token' },
    );
  });

  it('returns return comparison object with second pillar, epi, and market values', async () => {
    (get as jest.Mock).mockResolvedValueOnce({
      from: '',
      returns: [
        { key: 'MARKET', value: 0.0686 },
        { key: 'EPI', value: 0.0228 },
        { key: 'SECOND_PILLAR', value: 0.0436 },
      ],
    });

    const comparison = await getReturnComparison('', '');
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

    const comparison = await getReturnComparison('', '');
    expect(comparison).toStrictEqual({
      personal: null,
      pensionFund: 0.0228,
      index: null,
    });
  });
});
