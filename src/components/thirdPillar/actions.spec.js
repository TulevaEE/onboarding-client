import { mockStore } from '../../test/utils';
import {
  CHANGE_AGREEMENT_TO_TERMS,
  CHANGE_EXCHANGE_EXISTING_UNITS,
  CHANGE_MONTHLY_CONTRIBUTION,
  QUERY_PARAMETERS,
  SELECT_THIRD_PILLAR_SOURCES,
  THIRD_PILLAR_STATISTICS,
} from './constants';
import * as mockApi from '../common/api';

jest.useFakeTimers();

jest.mock('../common/api');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const actions = require('./actions'); // need to use require because of jest mocks being weird

describe('Third pillar actions', () => {
  let dispatch;
  let state;

  function createBoundAction(action) {
    return (...args) => action(...args)(dispatch, () => state);
  }

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

  it('can post third pillar statistics', () => {
    const statistics = {
      mandateId: 543,
      singlePayment: 100,
    };

    mockApi.postThirdPillarStatistics = jest.fn(() => {
      return Promise.resolve(statistics);
    });
    const thirdPillarStatistics = createBoundAction(actions.thirdPillarStatistics);

    return thirdPillarStatistics(statistics).then(() => {
      expect(dispatch).toHaveBeenCalledWith({
        type: THIRD_PILLAR_STATISTICS,
        statistics,
      });
      expect(dispatch).toHaveBeenCalledTimes(1);
    });
  });

  it('will not  post third pillar statistics on empty mandate id', () => {
    const statistics = {
      mandateId: null,
      singlePayment: 100,
    };

    const thirdPillarStatistics = createBoundAction(actions.thirdPillarStatistics);

    return thirdPillarStatistics(statistics).then(() => {
      expect(dispatch).not.toHaveBeenCalled();
    });
  });
});
