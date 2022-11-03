import { mockStore } from '../../test/utils';
import {
  CHANGE_AGREEMENT_TO_TERMS,
  CHANGE_EXCHANGE_EXISTING_UNITS,
  CHANGE_MONTHLY_CONTRIBUTION,
  QUERY_PARAMETERS,
  SELECT_THIRD_PILLAR_SOURCES,
} from './constants';

jest.useFakeTimers();

jest.mock('../common/api');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const actions = require('./actions'); // need to use require because of jest mocks being weird

describe('Third pillar actions', () => {
  let dispatch;
  let state;

  function mockDispatch() {
    state = { login: { token: 'token' }, exchange: {} };
    dispatch = jest.fn((action) => {
      if (typeof action === 'function') {
        action(dispatch, () => state);
      }
    });
  }

  beforeEach(() => {
    mockDispatch();
  });

  it('dispatches query parameters action when mapping query params to state', async () => {
    const store = mockStore();

    await store.dispatch(
      actions.addDataFromQueryParams({
        aKey: 'aValue',
        anotherKey: 'anotherValue',
      }),
    );

    expect(store.getActions()).toContainEqual({
      type: QUERY_PARAMETERS,
      query: { aKey: 'aValue', anotherKey: 'anotherValue' },
    });
  });

  it('dispatches monthly contribution change action', async () => {
    const store = mockStore();

    await store.dispatch(actions.changeMonthlyContribution(1000));

    expect(store.getActions()).toContainEqual({
      type: CHANGE_MONTHLY_CONTRIBUTION,
      monthlyContribution: 1000,
    });
  });

  it('dispatches exchange existing units change action', async () => {
    const store = mockStore();

    await store.dispatch(actions.changeExchangeExistingUnits(true));

    expect(store.getActions()).toContainEqual({
      type: CHANGE_EXCHANGE_EXISTING_UNITS,
      exchangeExistingUnits: true,
    });
  });

  it('dispatches agreement to terms change action', async () => {
    const store = mockStore();

    await store.dispatch(actions.changeAgreementToTerms(true));

    expect(store.getActions()).toContainEqual({
      type: CHANGE_AGREEMENT_TO_TERMS,
      agreedToTerms: true,
    });
  });

  it('can select third pillar sources', () => {
    const exchangeExistingUnits = true;
    const selectedFutureContributionsFundIsin = 'EE234';

    expect(
      actions.selectThirdPillarSources(exchangeExistingUnits, selectedFutureContributionsFundIsin),
    ).toEqual({
      type: SELECT_THIRD_PILLAR_SOURCES,
      exchangeExistingUnits,
      selectedFutureContributionsFundIsin,
    });
  });
});
