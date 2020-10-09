import { push } from 'connected-react-router';

function isUserLoaded(getState) {
  return !!getState().login.user;
}

export function selectRouteForState() {
  return (dispatch, getState) => {
    if (!isUserLoaded(getState)) {
      dispatch(push('/')); // load user
    }
  };
}
