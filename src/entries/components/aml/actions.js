import { createAmlCheck, getMissingAmlChecks } from '../common/api';
import {
  GET_MISSING_AML_CHECKS_ERROR,
  GET_MISSING_AML_CHECKS_START,
  GET_MISSING_AML_CHECKS_SUCCESS,
} from './constants';

export function createAmlChecks(amlChecks) {
  return (dispatch, getState) => {
    let promise = Promise.resolve();
    if (amlChecks !== undefined) {
      promise = createAmlCheck('RESIDENCY_MANUAL', amlChecks.isResident, {}, getState().login.token)
        .then(() => {
          return createAmlCheck(
            'POLITICALLY_EXPOSED_PERSON',
            !amlChecks.isPoliticallyExposed,
            {},
            getState().login.token,
          );
        })
        .then(() => {
          return createAmlCheck(
            'OCCUPATION',
            !!amlChecks.occupation,
            { occupation: amlChecks.occupation },
            getState().login.token,
          );
        });
    }
    return promise;
  };
}

export function getAmlChecks() {
  return (dispatch, getState) => {
    dispatch({ type: GET_MISSING_AML_CHECKS_START });
    return getMissingAmlChecks(getState().login.token)
      .then(missingAmlChecks => {
        dispatch({ type: GET_MISSING_AML_CHECKS_SUCCESS, missingAmlChecks });
      })
      .catch(error => dispatch({ type: GET_MISSING_AML_CHECKS_ERROR, error }));
  };
}
