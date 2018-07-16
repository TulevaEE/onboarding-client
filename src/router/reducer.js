import {
  ROUTE_TO_ACCOUNT,
} from './constants';

const initialState = {
  routeToAccount: false,
};

export default function routerReducer(state = initialState, action) {
  switch (action.type) {
    case ROUTE_TO_ACCOUNT:
      return { ...state,
        routeToAccount: true,
      };
    default:
      return state;
  }
}

