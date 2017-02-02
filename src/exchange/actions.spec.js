import {
  GET_SOURCE_FUNDS_START,
  GET_SOURCE_FUNDS_SUCCESS,
  GET_SOURCE_FUNDS_ERROR,

  SELECT_EXCHANGE_SOURCES,

  GET_TARGET_FUNDS_START,
  GET_TARGET_FUNDS_SUCCESS,
  GET_TARGET_FUNDS_ERROR,

  SELECT_TARGET_FUND,

  SET_TRANSFER_FUTURE_CAPITAL,
} from './constants';

const mockApi = jest.genMockFromModule('../common/api');
jest.mock('../common/api', () => mockApi);

const actions = require('./actions'); // need to use require because of jest mocks being weird

describe('Exchange actions', () => {
  let dispatch;
  let state;

  function createBoundAction(action) {
    return (...args) => action(...args)(dispatch, () => state);
  }

  function mockDispatch() {
    state = { login: { token: 'token' } };
    dispatch = jest.fn((action) => {
      if (typeof action === 'function') {
        action(dispatch, () => state);
      }
    });
  }

  beforeEach(mockDispatch);

  it('can get pension funds', () => {
    const sourceFunds = [{ iAmPensionFunds: true }];
    mockApi.getSourceFundsWithToken = jest.fn(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({ type: GET_SOURCE_FUNDS_START });
      dispatch.mockClear();
      return Promise.resolve(sourceFunds);
    });
    const getSourceFunds = createBoundAction(actions.getSourceFunds);
    expect(dispatch).not.toHaveBeenCalled();
    return getSourceFunds()
      .then(() => {
        expect(dispatch).toHaveBeenCalledTimes(1);
        expect(dispatch).toHaveBeenCalledWith({
          type: GET_SOURCE_FUNDS_SUCCESS,
          sourceFunds,
        });
      });
  });

  it('can handle errors when getting pension funds', () => {
    const error = new Error('oh no!');
    mockApi.getSourceFundsWithToken = jest.fn(() => Promise.reject(error));
    const getSourceFunds = createBoundAction(actions.getSourceFunds);
    expect(dispatch).not.toHaveBeenCalled();
    return getSourceFunds()
      .then(() => expect(dispatch).toHaveBeenCalledWith({ type: GET_SOURCE_FUNDS_ERROR, error }));
  });

  it('can select an exchange', () => {
    const sourceSelection = [{ exchangeMe: true }];
    expect(actions.selectExchangeSources(sourceSelection)).toEqual({
      type: SELECT_EXCHANGE_SOURCES,
      sourceSelection,
      sourceSelectionExact: false,
    });
    expect(actions.selectExchangeSources(sourceSelection, true)).toEqual({
      type: SELECT_EXCHANGE_SOURCES,
      sourceSelection,
      sourceSelectionExact: true,
    });
  });

  it('can get target funds', () => {
    const targetFunds = [{ iAmPensionFunds: true }];
    mockApi.getTargetFundsWithToken = jest.fn(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({ type: GET_TARGET_FUNDS_START });
      dispatch.mockClear();
      return Promise.resolve(targetFunds);
    });
    const getTargetFunds = createBoundAction(actions.getTargetFunds);
    expect(dispatch).not.toHaveBeenCalled();
    return getTargetFunds()
      .then(() => {
        expect(dispatch).toHaveBeenCalledTimes(1);
        expect(dispatch).toHaveBeenCalledWith({
          type: GET_TARGET_FUNDS_SUCCESS,
          targetFunds,
        });
      });
  });

  it('can handle errors when getting target funds', () => {
    const error = new Error('oh no!');
    mockApi.getTargetFundsWithToken = jest.fn(() => Promise.reject(error));
    const getTargetFunds = createBoundAction(actions.getTargetFunds);
    expect(dispatch).not.toHaveBeenCalled();
    return getTargetFunds()
      .then(() => expect(dispatch).toHaveBeenCalledWith({ type: GET_TARGET_FUNDS_ERROR, error }));
  });

  it('can select a target fund', () => {
    const targetFund = { iAmATargetFund: true };
    expect(actions.selectTargetFund(targetFund)).toEqual({
      type: SELECT_TARGET_FUND,
      targetFund,
    });
  });

  it('can set if you want to transfer future capital', () => {
    [true, false].forEach((transferFutureCapital) => {
      expect(actions.setTransferFutureCapital(transferFutureCapital)).toEqual({
        type: SET_TRANSFER_FUTURE_CAPITAL,
        transferFutureCapital,
      });
    });
  });
});
