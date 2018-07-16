import {
  GET_COMPARISON_BONUS_SUCCESS,
  GET_COMPARISON_ERROR,
  COMPARISON_SALARY_CHANGE,
  COMPARISON_RATE_CHANGE,
  SHOW_COMPARISON,
  HIDE_COMPARISON,
} from './constants';

const mockApi = jest.genMockFromModule('../common/api');
const mockDownload = jest.fn();
jest.mock('../common/api', () => mockApi);
jest.mock('downloadjs', () => mockDownload);

const actions = require('./actions'); // need to use require because of jest mocks being weird

describe('Comparison actions', () => {
  let dispatch;
  let state;

  function createBoundAction(action) {
    return (...args) => action(...args)(dispatch, () => state);
  }

  function mockDispatch() {
    state = { login: { token: 'token' }, comparison: {} };
    dispatch = jest.fn(action => {
      if (typeof action === 'function') {
        action(dispatch, () => state);
      }
    });
  }

  beforeEach(() => {
    mockDispatch();
  });

  it('can get comparison and bonus', () => {
    const comparison = [{ comparison: true }];
    mockApi.getComparisonForSalaryAndRateWithToken = jest.fn(() => {
      dispatch.mockClear();
      return Promise.resolve(comparison);
    });
    const getComparison = createBoundAction(actions.getComparison);
    expect(dispatch).not.toHaveBeenCalled();
    return getComparison().then(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({
        type: GET_COMPARISON_BONUS_SUCCESS,
        comparison,
      });
    });
  });

  it('can handle errors when getting comparison', () => {
    const error = new Error('oh no!');
    mockApi.getComparisonForSalaryAndRateWithToken = jest.fn(() => Promise.reject(error));
    const getComparison = createBoundAction(actions.getComparison);
    expect(dispatch).not.toHaveBeenCalled();
    return getComparison().then(() =>
      expect(dispatch).toHaveBeenCalledWith({
        type: GET_COMPARISON_ERROR,
        error,
      }),
    );
  });

  it('can handle salary change', () => {
    const salary = 1500;
    state.comparison.salary = salary;
    const changeSalary = createBoundAction(actions.changeSalary);
    changeSalary(salary);
    expect(dispatch).toHaveBeenCalledWith({
      type: COMPARISON_SALARY_CHANGE,
      salary,
    });
  });

  it('can handle rate change', () => {
    const rate = 5;
    state.comparison.rate = rate;
    const changeRate = createBoundAction(actions.changeRate);
    changeRate(rate);
    expect(dispatch).toHaveBeenCalledWith({
      type: COMPARISON_RATE_CHANGE,
      rate,
    });
  });

  it('can make comparison visible', () => {
    state.comparison.visible = false;
    const show = createBoundAction(actions.show);
    show();
    expect(dispatch).toHaveBeenCalledWith({ type: SHOW_COMPARISON });
  });

  it('can make comparison hidden', () => {
    state.comparison.visible = true;
    const hide = createBoundAction(actions.hide);
    hide();
    expect(dispatch).toHaveBeenCalledWith({ type: HIDE_COMPARISON });
  });
});
