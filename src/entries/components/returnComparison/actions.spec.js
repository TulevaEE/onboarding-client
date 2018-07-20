import { mockStore } from '../../../test/utils';
import { getReturnComparison } from './actions';
import { getReturnComparisonWithToken } from '../common/api';
import {
  GET_RETURN_COMPARISON_START,
  GET_RETURN_COMPARISON_SUCCESS,
  GET_RETURN_COMPARISON_ERROR,
} from './constants';

jest.mock('../common/api', () => ({ getReturnComparisonWithToken: jest.fn() }));

describe('Return comparison actions', () => {
  describe('getting return comparison', () => {
    it('dispatches start action when fetching starts', async () => {
      const store = mockStore();

      await store.dispatch(getReturnComparison());

      const actions = store.getActions();
      expect(actions).toContainEqual({ type: GET_RETURN_COMPARISON_START });
    });

    it('gets comparison with token from state', async () => {
      const store = mockStoreWithToken('a-token');
      mockAPIResponse(Promise.resolve({}));

      await store.dispatch(getReturnComparison());

      expect(getReturnComparisonWithToken).toHaveBeenCalledWith('a-token');
    });

    it('dispatches success action with percentages if fetching succeeds', async () => {
      const store = mockStoreWithToken();
      mockAPIResponse(
        Promise.resolve({
          actualReturnPercentage: 0.0123,
          estonianReturnPercentage: 0.0456,
          marketReturnPercentage: 0.0789,
        }),
      );

      await store.dispatch(getReturnComparison());

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
      mockAPIResponse(Promise.reject({ message: 'An error' }));

      await store.dispatch(getReturnComparison());

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
    getReturnComparisonWithToken.mockReturnValue(response);
  }
});
