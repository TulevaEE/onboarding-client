import { push } from 'react-router-redux';

function isMember(state) {
  if (state.login.user.memberNumber) {
    return true;
  }
  return false;
}

export function route() {
  return (dispatch, getState) => {
    if (isMember(getState())) {
      dispatch(push('/steps/select-sources'));
    } else {
      dispatch(push('/newUser'));
    }
  };
}

export default route;
