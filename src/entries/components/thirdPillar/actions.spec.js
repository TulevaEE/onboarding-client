import { mockStore } from '../../../test/utils';
import {
  addDataFromQueryParams,
  changeMonthlyContribution,
  changeExchangeExistingUnits,
} from './actions';
import {
  QUERY_PARAMETERS,
  CHANGE_MONTHLY_CONTRIBUTION,
  CHANGE_EXCHANGE_EXISTING_UNITS,
} from './constants';

describe('Third pillar actions', () => {
  it('dispatches query parameters action when mapping query params to state', async () => {
    const store = mockStore();

    await store.dispatch(addDataFromQueryParams({ aKey: 'aValue', anotherKey: 'anotherValue' }));

    const actions = store.getActions();
    expect(actions).toContainEqual({
      type: QUERY_PARAMETERS,
      query: { aKey: 'aValue', anotherKey: 'anotherValue' },
    });
  });

  it('dispatches monthly contribution change action', async () => {
    const store = mockStore();

    await store.dispatch(changeMonthlyContribution(1000));

    const actions = store.getActions();
    expect(actions).toContainEqual({
      type: CHANGE_MONTHLY_CONTRIBUTION,
      monthlyContribution: 1000,
    });
  });

  it('dispatches exchange existing units change action', async () => {
    const store = mockStore();

    await store.dispatch(changeExchangeExistingUnits(true));

    const actions = store.getActions();
    expect(actions).toContainEqual({
      type: CHANGE_EXCHANGE_EXISTING_UNITS,
      exchangeExistingUnits: true,
    });
  });
});
