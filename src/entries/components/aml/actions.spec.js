import { GET_MISSING_AML_CHECKS_START, GET_MISSING_AML_CHECKS_SUCCESS } from './constants';

const mockApi = jest.genMockFromModule('../common/api');

jest.mock('../common/api', () => mockApi);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const actions = require('./actions'); // need to use require because of jest mocks being weird

describe('AML actions', () => {
  let dispatch;
  let state;

  function createBoundAction(action) {
    return (...args) => action(...args)(dispatch, () => state);
  }

  function mockDispatch() {
    state = { login: { token: 'token' } };

    dispatch = jest.fn(action => {
      if (typeof action === 'function') {
        action(dispatch, () => state);
      }
      return Promise.resolve();
    });
  }

  beforeEach(() => {
    mockDispatch();
  });

  it('creates aml checks if needed', () => {
    const amlChecks = {
      isPoliticallyExposed: true,
      isResident: true,
      occupation: 'PRIVATE_SECTOR',
    };
    mockApi.createAmlCheck = jest.fn(() => Promise.resolve());
    mockApi.getMissingAmlChecks = jest.fn(() => Promise.resolve());
    const createAmlChecks = createBoundAction(actions.createAmlChecks);
    return createAmlChecks(amlChecks).then(() => {
      expect(mockApi.createAmlCheck).toHaveBeenCalledTimes(3);
      expect(mockApi.getMissingAmlChecks).toHaveBeenCalledTimes(1);
    });
  });

  it('can get missing aml checks', () => {
    const missingAmlChecks = [{ type: 'CONTACT_DETAILS', success: false }];
    mockApi.getMissingAmlChecks = jest.fn(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({ type: GET_MISSING_AML_CHECKS_START });
      dispatch.mockClear();
      return Promise.resolve(missingAmlChecks);
    });
    const getSourceFunds = createBoundAction(actions.getAmlChecks);
    expect(dispatch).not.toHaveBeenCalled();
    return getSourceFunds().then(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({
        type: GET_MISSING_AML_CHECKS_SUCCESS,
        missingAmlChecks,
      });
    });
  });
});
