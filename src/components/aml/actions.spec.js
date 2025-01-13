import {
  CHANGE_OCCUPATION,
  CHANGE_POLITICALLY_EXPOSED,
  CHANGE_RESIDENCY,
  CREATE_AML_CHECKS_ERROR,
  CREATE_AML_CHECKS_SUCCESS,
  GET_MISSING_AML_CHECKS_ERROR,
  GET_MISSING_AML_CHECKS_START,
  GET_MISSING_AML_CHECKS_SUCCESS,
} from './constants';
import { mockStore } from '../../test/utils';
import * as mockApi from '../common/api';

jest.mock('../common/api');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const actions = require('./actions'); // need to use require because of jest mocks being weird

describe('AML actions', () => {
  let dispatch;
  let state;

  function createBoundAction(action) {
    return (...args) => action(...args)(dispatch, () => state);
  }

  function mockDispatch() {
    state = {};

    dispatch = jest.fn((action) => {
      if (typeof action === 'function') {
        action(dispatch, () => state);
      }
      return Promise.resolve();
    });
  }

  beforeEach(() => {
    mockDispatch();
  });

  it('dispatches politically exposed change action', async () => {
    const store = mockStore();

    await store.dispatch(actions.changeIsPoliticallyExposed(true));

    expect(store.getActions()).toContainEqual({
      type: CHANGE_POLITICALLY_EXPOSED,
      isPoliticallyExposed: true,
    });
  });

  it('dispatches residency change action', async () => {
    const store = mockStore();

    await store.dispatch(actions.changeIsResident(true));

    expect(store.getActions()).toContainEqual({
      type: CHANGE_RESIDENCY,
      isResident: true,
    });
  });

  it('dispatches occupation change action', async () => {
    const store = mockStore();

    await store.dispatch(actions.changeOccupation('PUBLIC_SECTOR'));

    expect(store.getActions()).toContainEqual({
      type: CHANGE_OCCUPATION,
      occupation: 'PUBLIC_SECTOR',
    });
  });

  it('creates aml checks if needed', () => {
    const amlChecks = {
      isPoliticallyExposed: true,
      isResident: true,
      occupation: 'PRIVATE_SECTOR',
    };
    mockApi.createAmlCheck = jest.fn(() => Promise.resolve());
    const createAmlChecks = createBoundAction(actions.createAmlChecks);
    return createAmlChecks(amlChecks).then(() => {
      expect(mockApi.createAmlCheck).toHaveBeenCalledTimes(3);
    });
  });

  it('can get missing aml checks', () => {
    const missingAmlChecks = [{ type: 'CONTACT_DETAILS', success: false }];
    mockApi.getMissingAmlChecks = jest.fn(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({
        type: GET_MISSING_AML_CHECKS_START,
      });
      dispatch.mockClear();
      return Promise.resolve(missingAmlChecks);
    });
    const getAmlChecks = createBoundAction(actions.getAmlChecks);
    expect(dispatch).not.toHaveBeenCalled();
    return getAmlChecks().then(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({
        type: GET_MISSING_AML_CHECKS_SUCCESS,
        missingAmlChecks,
      });
    });
  });

  it('can handle errors when getting missing aml checks', () => {
    const error = {
      body: { errors: [{ code: 'oopsie' }] },
    };
    mockApi.getMissingAmlChecks = jest.fn(() => Promise.reject(error));
    const getAmlChecks = createBoundAction(actions.getAmlChecks);
    expect(dispatch).not.toHaveBeenCalled();

    return getAmlChecks().then(() =>
      expect(dispatch).toHaveBeenCalledWith({
        type: GET_MISSING_AML_CHECKS_ERROR,
        error,
      }),
    );
  });

  it('updates user together with aml checks', () => {
    state.aml = {
      isPoliticallyExposed: false,
      isResident: true,
      occupation: 'PRIVATE_SECTOR',
    };
    const user = { amUser: true };
    mockApi.updateUserWithToken = jest.fn(() => Promise.resolve());
    mockApi.createAmlCheck = jest.fn(() => Promise.resolve());
    mockApi.getMissingAmlChecks = jest.fn(() => Promise.resolve());
    const updateUserAndAml = createBoundAction(actions.updateUserAndAml);
    return updateUserAndAml(user).then(() => {
      expect(mockApi.updateUserWithToken).toHaveBeenCalled();
      expect(mockApi.createAmlCheck).toHaveBeenCalled();
      expect(mockApi.getMissingAmlChecks).toHaveBeenCalled();
    });
  });

  it('dispatches all AML checks for valid amlChecks', async () => {
    const amlChecks = {
      isResident: true,
      isPoliticallyExposed: false,
      occupation: 'PRIVATE_SECTOR',
    };

    mockApi.createAmlCheck = jest.fn(() => Promise.resolve());
    const store = mockStore();
    await store.dispatch(actions.createAmlChecks(amlChecks));

    expect(mockApi.createAmlCheck).toHaveBeenCalledTimes(3);
    expect(mockApi.createAmlCheck).toHaveBeenNthCalledWith(1, 'RESIDENCY_MANUAL', true, {});
    expect(mockApi.createAmlCheck).toHaveBeenNthCalledWith(
      2,
      'POLITICALLY_EXPOSED_PERSON',
      true,
      {},
    );
    expect(mockApi.createAmlCheck).toHaveBeenNthCalledWith(3, 'OCCUPATION', true, {
      occupation: 'PRIVATE_SECTOR',
    });

    expect(store.getActions()).toContainEqual({
      type: CREATE_AML_CHECKS_SUCCESS,
    });
  });

  it('handles errors during AML checks', async () => {
    const amlChecks = {
      isResident: true,
      isPoliticallyExposed: false,
      occupation: 'PRIVATE_SECTOR',
    };

    const error = new Error('Test Error');
    mockApi.createAmlCheck = jest.fn(() => Promise.reject(error));
    const store = mockStore();

    await store.dispatch(actions.createAmlChecks(amlChecks)).catch((err) => {
      expect(err).toBe(error);
    });

    expect(mockApi.createAmlCheck).toHaveBeenCalledTimes(1);
    expect(store.getActions()).toContainEqual({
      type: CREATE_AML_CHECKS_ERROR,
      error,
    });
  });
});
