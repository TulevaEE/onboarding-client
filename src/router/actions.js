import { push } from 'react-router-redux';


function isMember(state) {
  return false;
}

export function getRoute() {
  return (dispatch, getState) => {
    isMember(getState());
    dispatch(push('/newUser'));
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
