import { createTrackedEvent } from '../common/api';

import {
  CREATE_TRACKED_EVENT_START,
  CREATE_TRACKED_EVENT_SUCCESS,
  CREATE_TRACKED_EVENT_ERROR
} from "./constants";

export function trackEvent(type, data) {
  return (dispatch, getState) => {
    if (type === undefined) {
      return Promise.resolve();
    }
    dispatch({ type: CREATE_TRACKED_EVENT_START });
    return createTrackedEvent(type, data, getState().login.token)
      .then(() => dispatch({ type: CREATE_TRACKED_EVENT_SUCCESS }))
      .catch((error) => dispatch({ type: CREATE_TRACKED_EVENT_ERROR, error }));
  };
}