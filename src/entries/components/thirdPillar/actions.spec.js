import { mockStore } from '../../../test/utils';
import { mapUrlQueryParamsToState } from './actions';
import { QUERY_PARAMETERS } from './constants';

describe('Third pillar actions', () => {
  it('dispatches query parameters action when mapping query params to state', async () => {
    const store = mockStore();

    await store.dispatch(mapUrlQueryParamsToState({ aKey: 'aValue', anotherKey: 'anotherValue' }));

    const actions = store.getActions();
    expect(actions).toContainEqual({
      type: QUERY_PARAMETERS,
      query: { aKey: 'aValue', anotherKey: 'anotherValue' },
    });
  });
});
