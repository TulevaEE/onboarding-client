import { UPDATE_USER_START, UPDATE_USER_SUCCESS, USER_UPDATED } from '../common/user/constants';

export const initialState = {
  updateUserSuccess: false,
  submitting: false,
};

export default function accountReducer(state = initialState, action) {
  switch (action.type) {
    case UPDATE_USER_START:
      return {
        ...state,
        submitting: true,
      };
    case UPDATE_USER_SUCCESS:
      return {
        ...state,
        updateUserSuccess: true,
        submitting: false,
      };
    case USER_UPDATED:
      return {
        ...state,
        updateUserSuccess: false,
        submitting: false,
      };
    default:
      return state;
  }
}
