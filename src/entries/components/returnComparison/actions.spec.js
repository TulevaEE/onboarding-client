import { mockStore } from '../../../test/utils';
import { getReturnComparisonForStartDate } from './actions';
import { getReturnComparisonForStartDateWithToken } from '../common/api';
import {
  GET_RETURN_COMPARISON_START,
  GET_RETURN_COMPARISON_SUCCESS,
  GET_RETURN_COMPARISON_ERROR,
} from './constants';

jest.mock('../common/api', () => ({ getReturnComparisonForStartDateWithToken: jest.fn() }));

describe('Return comparison actions', () => {
  describe('getting return comparison', () => {
    it('dispatches start action when fetching starts', async () => {
      const store = mockStore();

      await store.dispatch(getReturnComparisonForStartDate('2015-10-03'));

      const actions = store.getActions();
      expect(actions).toContainEqual({ type: GET_RETURN_COMPARISON_START });
    });

    it('gets comparison with date and token from state', async () => {
      const store = mockStoreWithToken('a-token');
      mockAPIResponse(Promise.resolve({}));

      await store.dispatch(getReturnComparisonForStartDate('2015-10-03'));

      expect(getReturnComparisonForStartDateWithToken).toHaveBeenCalledWith(
        '2015-10-03',
        'a-token',
      );
    });

    it('dispatches success action with percentages if fetching succeeds', async () => {
      const store = mockStoreWithToken();
      mockAPIResponse(
        Promise.resolve({
          actualReturnPercentage: 0.0123,
          estonianAverageReturnPercentage: 0.0456,
          marketAverageReturnPercentage: 0.0789,
        }),
      );

      await store.dispatch(getReturnComparisonForStartDate('2015-10-03'));

      const actions = store.getActions();
      expect(actions).toContainEqual({
        type: GET_RETURN_COMPARISON_SUCCESS,
        actualPercentage: 0.0123,
        estonianPercentage: 0.0456,
        marketPercentage: 0.0789,
      });
    });

    it('dispatches error action with error if fetching fails', async () => {
      const store = mockStoreWithToken();
      mockAPIResponse(Promise.reject(new Error({ message: 'An error' })));

      await store.dispatch(getReturnComparisonForStartDate('2015-10-03'));

      const actions = store.getActions();
      expect(actions).toContainEqual({
        type: GET_RETURN_COMPARISON_ERROR,
        error: { message: 'An error' },
      });
    });
  });

  function mockStoreWithToken(token) {
    return mockStore({ login: { token } });
  }

  function mockAPIResponse(response) {
    getReturnComparisonForStartDateWithToken.mockReturnValue(response);
  }
});
