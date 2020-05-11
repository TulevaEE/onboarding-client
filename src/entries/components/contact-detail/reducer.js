import { UPDATE_USER_SUCCESS, USER_UPDATED } from '../common/user/constants';

export const initialState = {
  updateUserSuccess: false,
};

export default function accountReducer(state = initialState, action) {
  switch (action.type) {
    case UPDATE_USER_SUCCESS:
      return {
        ...state,
        updateUserSuccess: true,
      };
    case USER_UPDATED:
      return {
        ...state,
        updateUserSuccess: false,
      };
    default:
      return state;
  }
}
