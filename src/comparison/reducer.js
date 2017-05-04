import {
  GET_COMPARISON_START,
  GET_COMPARISON_SUCCESS,
  GET_COMPARISON_ERROR,
  COMPARISON_SALARY_CHANGE,
  COMPARISON_RATE_CHANGE,
  SHOW_COMPARISON,
  HIDE_COMPARISON,
} from './constants';

const initialState = {
  salary: 1500,
  rate: 0.07,
  comparison: null,
  loadingComparison: false,
  error: null,
  visible: false,
};

export default function comparisonReducer(state = initialState, action) {
  switch (action.type) {
    case GET_COMPARISON_START:
      return { ...state,
        loadingComparison: true,
        error: null,
      };
    case GET_COMPARISON_SUCCESS:
      return {
        ...state,
        loadingComparison: false,
        comparison: action.comparison,
      };
    case GET_COMPARISON_ERROR:
      return { ...state,
        loadingComparison: false,
        error: action.error,
      };
    case COMPARISON_SALARY_CHANGE:
      return { ...state,
        salary: action.salary,
      };
    case COMPARISON_RATE_CHANGE:
      return { ...state,
        rate: action.rate,
      };
    case SHOW_COMPARISON:
      return { ...state,
        visible: true,
      };
    case HIDE_COMPARISON:
      return { ...state,
        visible: false,
      };
    default:
      return state;
  }
}
