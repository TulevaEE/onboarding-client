import { createAmlCheck, getMissingAmlChecks } from '../common/api';
import {
  CHANGE_OCCUPATION,
  CHANGE_POLITICALLY_EXPOSED,
  CHANGE_RESIDENCY,
  CREATE_AML_CHECKS_START,
  CREATE_AML_CHECKS_SUCCESS,
  CREATE_AML_CHECKS_ERROR,
  GET_MISSING_AML_CHECKS_START,
  GET_MISSING_AML_CHECKS_SUCCESS,
  GET_MISSING_AML_CHECKS_ERROR,
} from './constants';
import * as userActions from '../common/user/actions';

export function changeIsPoliticallyExposed(isPoliticallyExposed) {
  return { type: CHANGE_POLITICALLY_EXPOSED, isPoliticallyExposed };
}

export function changeIsResident(isResident) {
  return { type: CHANGE_RESIDENCY, isResident };
}

export function changeOccupation(occupation) {
  return { type: CHANGE_OCCUPATION, occupation };
}

export function createAmlChecks(amlChecks) {
  return (dispatch) => {
    if (amlChecks === undefined) {
      return Promise.resolve();
    }
    dispatch({ type: CREATE_AML_CHECKS_START });
    return createAmlCheck('RESIDENCY_MANUAL', amlChecks.isResident, {})
      .then(() =>
        amlChecks.isPoliticallyExposed != null
          ? createAmlCheck(
              'POLITICALLY_EXPOSED_PERSON',
              amlChecks.isPoliticallyExposed === false,
              {},
            )
          : Promise.resolve(),
      )
      .then(() =>
        amlChecks.occupation != null
          ? createAmlCheck('OCCUPATION', !!amlChecks.occupation, {
              occupation: amlChecks.occupation,
            })
          : Promise.resolve(),
      )
      .then(() => dispatch({ type: CREATE_AML_CHECKS_SUCCESS }))
      .catch((error) => {
        dispatch({ type: CREATE_AML_CHECKS_ERROR, error });
        return Promise.reject(error);
      });
  };
}

export function getAmlChecks() {
  return (dispatch) => {
    dispatch({ type: GET_MISSING_AML_CHECKS_START });
    return getMissingAmlChecks()
      .then((missingAmlChecks) =>
        dispatch({ type: GET_MISSING_AML_CHECKS_SUCCESS, missingAmlChecks }),
      )
      .catch((error) => dispatch({ type: GET_MISSING_AML_CHECKS_ERROR, error }));
  };
}

export function updateUserAndAml(user) {
  return (dispatch, getState) =>
    dispatch(userActions.updateUser(user))
      .then(() => dispatch(createAmlChecks(getState().aml)))
      .then(() => dispatch(getAmlChecks()));
}
