import { ROUTE_TO_QUIZ } from './constants';

const initialState = {
  routeToQuiz: false,
};

export default function comparisonReducer(state = initialState, action) {
  switch (action.type) {
    case ROUTE_TO_QUIZ:
      return {
        ...state,
        routeToQuiz: true,
      };
    default:
      return state;
  }
}
