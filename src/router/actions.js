import { push } from 'react-router-redux';


function isMember(state) {
  if (state.user.memberNumber) {
    return true;
  }
  return false;
}

export function route() {
  return (dispatch, getState) => {
    // getState();
    if (isMember(getState())) {
      dispatch(push('/steps/select-sources'));
    } else {
      dispatch(push('/newUser'));
    }
  };
}

export function getRoute2() {
  return (dispatch, getState) => {
    getState();
    dispatch({ type: '@newUserFlow/blah' });
  };
}

// export const Router = () => (
// );
// export default Router;
