import { push } from 'react-router-redux';

function isMember(getState) {
  if (getState().login.user.memberNumber) {
    return true;
  }
  return false;
}

function isDataLoaded(getState) {
  if (getState().login.user) {
    return true;
  }
  return false;
}

export function selectRouteForState() {
  return (dispatch, getState) => {
    if (!isDataLoaded(getState)) {
      dispatch(push('/'));
    } else if (isMember(getState)) {
      dispatch(push('/steps/select-sources'));
    } else {
      dispatch(push('/steps/new-user'));
    }
  };
}

export default selectRouteForState;
