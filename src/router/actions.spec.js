import { push } from 'react-router-redux';

const actions = require('./actions'); // need to use require because of jest mocks being weird

describe('Routing actions', () => {
  let dispatch;
  let state;

  function mockDispatch() {
    state = {};
    state.login = { };
    state.login.user = {};
    state.quiz = {};
    state.quiz.routeToQuiz = false;
    state.exchange = {};
    state.exchange.shortFlow = false;
    dispatch = jest.fn((action) => {
      if (typeof action === 'function') {
        action(dispatch, () => state);
      }
    });
  }

  function createBoundAction(action) {
    return (...args) => action(...args)(dispatch, () => state);
  }

  beforeEach(() => {
    mockDispatch();
  });

  it('can perform routing for members who have not completed transfers', () => {
    state.login.user.memberNumber = 123;
    state.login.userConversion = {
      transfersComplete: false,
      selectionComplete: true,
    };

    const action = createBoundAction(actions.selectRouteForState);
    action();

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(push('/steps/select-sources'));
  });

  it('can perform routing for members who have completed transfers but not completed selection', () => {
    state.login.user.memberNumber = 123;
    state.login.userConversion = {
      transfersComplete: true,
      selectionComplete: false,
    };

    const action = createBoundAction(actions.selectRouteForState);
    action();

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(push('/steps/transfer-future-capital'));
  });

  it('can perform routing for fully converted members', () => {
    state.login.user.memberNumber = 123;
    state.login.userConversion = {
      transfersComplete: true,
      selectionComplete: true,
    };

    const action = createBoundAction(actions.selectRouteForState);
    action();

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(push('/account'));
  });

  it('can perform non member routing', () => {
    state.login.user.memberNumber = null;

    const action = createBoundAction(actions.selectRouteForState);
    action();

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(push('/steps/new-user'));
  });

  it('can perform routing when user is not loaded', () => {
    state.login = {};

    const action = createBoundAction(actions.selectRouteForState);
    action();

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(push('/'));
  });

  it('routes forward from source selection step on advanced flow', () => {
    state.exchange = { sourceSelectionExact: true };

    const action = createBoundAction(actions.routeForwardFromSourceSelection);
    action();

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(push('/steps/transfer-future-capital'));
  });

  it('routes forward from source selection step, skiping contributions fund selection, on simple flow', () => {
    state.exchange = { sourceSelectionExact: false, sourceSelection: [[]] };

    const action = createBoundAction(actions.routeForwardFromSourceSelection);
    action();

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(push('/steps/confirm-mandate'));
  });

  it('routes back from source selection step on advanced flow', () => {
    state.exchange = { sourceSelectionExact: true };

    const action = createBoundAction(actions.routeBackFromMandateConfirmation);
    action();

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(push('/steps/transfer-future-capital'));
  });

  it('routes back from source selection step, skiping contributions fund selection, on simple flow', () => {
    state.exchange = { sourceSelectionExact: false, sourceSelection: [[]] };

    const action = createBoundAction(actions.routeBackFromMandateConfirmation);
    action();

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(push('/steps/select-sources'));
  });

  it('can route to quiz', () => {
    state.login = {};
    state.quiz.routeToQuiz = true;

    const action = createBoundAction(actions.selectRouteForState);
    action();

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(push('/quiz'));
  });

  it('can route to short flow', () => {
    state.login = {};
    state.exchange.shortFlow = true;

    const action = createBoundAction(actions.selectRouteForState);
    action();

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(push('/steps/confirm-mandate'));
  });

  it('can disable router', () => {
    state.login = {};
    state.login.disableRouter = true;

    const action = createBoundAction(actions.selectRouteForState);
    action();

    expect(dispatch).toHaveBeenCalledTimes(0);
  });
});
