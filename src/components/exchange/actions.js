import { push } from 'connected-react-router';
import download from 'downloadjs';
import hwcrypto from 'hwcrypto-js';

import {
  downloadMandatePreviewWithIdAndToken,
  downloadMandateWithIdAndToken,
  getIdCardSignatureHashForMandateIdWithCertificateHexAndToken,
  getIdCardSignatureStatusForMandateIdWithSignedHashAndToken,
  getMobileIdSignatureChallengeCodeForMandateIdWithToken,
  getMobileIdSignatureStatusForMandateIdWithToken,
  getSmartIdSignatureChallengeCodeForMandateIdWithToken,
  getSmartIdSignatureStatusForMandateIdWithToken,
  getSourceFundsWithToken,
  getFunds,
  saveMandateWithToken,
} from '../common/api';
import {
  CHANGE_AGREEMENT_TO_TERMS,
  GET_SOURCE_FUNDS_ERROR,
  GET_SOURCE_FUNDS_START,
  GET_SOURCE_FUNDS_SUCCESS,
  GET_TARGET_FUNDS_ERROR,
  GET_TARGET_FUNDS_START,
  GET_TARGET_FUNDS_SUCCESS,
  NO_SIGN_MANDATE_ERROR,
  SELECT_EXCHANGE_SOURCES,
  SELECT_TARGET_FUND,
  SIGN_MANDATE_ERROR,
  SIGN_MANDATE_ID_CARD_SIGN_HASH_SUCCESS,
  SIGN_MANDATE_ID_CARD_START,
  SIGN_MANDATE_ID_CARD_START_SUCCESS,
  SIGN_MANDATE_INVALID_ERROR,
  SIGN_MANDATE_MOBILE_ID_CANCEL,
  SIGN_MANDATE_MOBILE_ID_START,
  SIGN_MANDATE_MOBILE_ID_START_SUCCESS,
  SIGN_MANDATE_START_ERROR,
  SIGN_MANDATE_SUCCESS,
  SIGN_MANDATE_IN_PROGRESS,
} from './constants';
import { actions as amlActions } from '../aml';

const POLL_DELAY = 1000;

const SIGNATURE_DONE_STATUS = 'SIGNATURE';
const SIGNING_IN_PROGRESS_STATUS = 'OUTSTANDING_TRANSACTION';

let timeout;

export function getSourceFunds() {
  return (dispatch, getState) => {
    dispatch({ type: GET_SOURCE_FUNDS_START });
    return getSourceFundsWithToken(getState().login.token)
      .then((sourceFunds) => {
        dispatch({ type: GET_SOURCE_FUNDS_SUCCESS, sourceFunds });
      })
      .catch((error) => dispatch({ type: GET_SOURCE_FUNDS_ERROR, error }));
  };
}

export function selectExchangeSources(sourceSelection, sourceSelectionExact = false) {
  return {
    type: SELECT_EXCHANGE_SOURCES,
    sourceSelection,
    sourceSelectionExact,
  };
}

export function changeAgreementToTerms(agreement) {
  return { type: CHANGE_AGREEMENT_TO_TERMS, agreement };
}

export function downloadMandate() {
  return (dispatch, getState) => {
    const mandateId = getState().exchange.signedMandateId;
    const { token } = getState().login;
    if (mandateId && token) {
      return downloadMandateWithIdAndToken(mandateId, token).then((file) =>
        download(file, 'Tuleva_avaldus.bdoc', 'application/bdoc'),
      );
    }
    return Promise.resolve();
  };
}

export function getTargetFunds() {
  return (dispatch, getState) => {
    dispatch({ type: GET_TARGET_FUNDS_START });
    return getFunds(getState().login.token)
      .then((targetFunds) => dispatch({ type: GET_TARGET_FUNDS_SUCCESS, targetFunds }))
      .catch((error) => dispatch({ type: GET_TARGET_FUNDS_ERROR, error }));
  };
}

export function selectFutureContributionsFund(targetFundIsin) {
  return { type: SELECT_TARGET_FUND, targetFundIsin };
}

function pollForMandateSignatureWithMandateId(mandateId) {
  return (dispatch, getState) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      getMobileIdSignatureStatusForMandateIdWithToken(mandateId, getState().login.token)
        .then((status) => {
          if (status.statusCode === SIGNING_IN_PROGRESS_STATUS) {
            dispatch({
              type: SIGN_MANDATE_IN_PROGRESS,
              controlCode: status.challengeCode,
            });
            dispatch(pollForMandateSignatureWithMandateId(mandateId));
          } else {
            dispatch({
              type: SIGN_MANDATE_SUCCESS,
              signedMandateId: mandateId,
            });
            if (window.useHackySecondPillarRoutePushesInActions) {
              dispatch(push('/2nd-pillar-flow/success'));
            }
          }
        })
        .catch((error) => dispatch({ type: SIGN_MANDATE_ERROR, error }));
    }, POLL_DELAY);
  };
}

function pollForMandateSignatureWithMandateIdUsingSmartId(mandateId) {
  return (dispatch, getState) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      getSmartIdSignatureStatusForMandateIdWithToken(mandateId, getState().login.token)
        .then((status) => {
          if (status.statusCode === SIGNING_IN_PROGRESS_STATUS) {
            dispatch({
              type: SIGN_MANDATE_IN_PROGRESS,
              controlCode: status.challengeCode,
            });
            dispatch(pollForMandateSignatureWithMandateIdUsingSmartId(mandateId));
          } else {
            dispatch({
              type: SIGN_MANDATE_SUCCESS,
              signedMandateId: mandateId,
            });
            if (window.useHackySecondPillarRoutePushesInActions) {
              dispatch(push('/2nd-pillar-flow/success'));
            }
          }
        })
        .catch((error) => dispatch({ type: SIGN_MANDATE_ERROR, error }));
    }, POLL_DELAY);
  };
}

function handleSaveMandateError(dispatch, error) {
  if (error?.status === 400) {
    dispatch({ type: SIGN_MANDATE_INVALID_ERROR, error });
  } else {
    dispatch({ type: SIGN_MANDATE_START_ERROR, error });
  }
}

export function previewMandate(mandate, amlChecks) {
  return (dispatch, getState) => {
    const { token } = getState().login;
    return dispatch(amlActions.createAmlChecks(amlChecks))
      .then(() => saveOrRetrieveExistingMandate(mandate, token))
      .then(({ id }) => downloadMandatePreviewWithIdAndToken(id, token))
      .then((file) => download(file, 'Tuleva_avaldus_eelvaade.zip', 'application/zip'))
      .catch((error) => {
        handleSaveMandateError(dispatch, error);
      });
  };
}

export function signMandateWithMobileId(mandate) {
  return (dispatch, getState) => {
    dispatch({ type: SIGN_MANDATE_MOBILE_ID_START });
    const { token } = getState().login;
    let mandateId;
    return saveOrRetrieveExistingMandate(mandate, token)
      .then(({ id }) => {
        mandateId = id;
        return getMobileIdSignatureChallengeCodeForMandateIdWithToken(mandateId, token);
      })
      .then((controlCode) => {
        dispatch({ type: SIGN_MANDATE_MOBILE_ID_START_SUCCESS, controlCode });
        dispatch(pollForMandateSignatureWithMandateId(mandateId));
      })
      .catch((error) => {
        handleSaveMandateError(dispatch, error);
      });
  };
}

export function signMandateWithSmartId(mandate) {
  return (dispatch, getState) => {
    dispatch({ type: SIGN_MANDATE_MOBILE_ID_START });
    const { token } = getState().login;
    let mandateId;
    return saveOrRetrieveExistingMandate(mandate, token)
      .then(({ id }) => {
        mandateId = id;
        return getSmartIdSignatureChallengeCodeForMandateIdWithToken(mandateId, token);
      })
      .then((controlCode) => {
        dispatch({ type: SIGN_MANDATE_MOBILE_ID_START_SUCCESS, controlCode });
        dispatch(pollForMandateSignatureWithMandateIdUsingSmartId(mandateId));
      })
      .catch((error) => {
        handleSaveMandateError(dispatch, error);
      });
  };
}

function pollForMandateSignatureWithMandateIdAndSignedHash(mandateId, signedHash) {
  return (dispatch, getState) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      getIdCardSignatureStatusForMandateIdWithSignedHashAndToken(
        mandateId,
        signedHash,
        getState().login.token,
      )
        .then((statusCode) => {
          if (statusCode === SIGNATURE_DONE_STATUS) {
            dispatch({
              type: SIGN_MANDATE_SUCCESS,
              signedMandateId: mandateId,
            });
            if (window.useHackySecondPillarRoutePushesInActions) {
              dispatch(push('/2nd-pillar-flow/success'));
            }
          } else if (statusCode === SIGNING_IN_PROGRESS_STATUS) {
            dispatch(pollForMandateSignatureWithMandateIdAndSignedHash(mandateId, signedHash));
          } else {
            dispatch({ type: SIGN_MANDATE_ERROR, statusCode });
          }
        })
        .catch((error) => dispatch({ type: SIGN_MANDATE_ERROR, error }));
    }, POLL_DELAY);
  };
}

function signIdCardSignatureHashWithCertificateForMandateId(hash, certificate, mandateId) {
  return (dispatch) =>
    hwcrypto
      .sign(certificate, { type: 'SHA-256', hex: hash }, { lang: 'en' })
      .then(
        (signature) => {
          dispatch({ type: SIGN_MANDATE_ID_CARD_SIGN_HASH_SUCCESS });
          return signature.hex;
        },
        (error) => {
          dispatch({ type: SIGN_MANDATE_ERROR, error });
        },
      )
      .then((signedHash) => {
        dispatch(pollForMandateSignatureWithMandateIdAndSignedHash(mandateId, signedHash));
      })
      .catch((error) => {
        handleSaveMandateError(dispatch, error);
      });
}

function saveOrRetrieveExistingMandate(mandate, token) {
  if (typeof mandate === 'object' && mandate.id) {
    return Promise.resolve(mandate);
  }
  return saveMandateWithToken(mandate, token);
}

export function signMandateWithIdCard(mandate) {
  return (dispatch, getState) => {
    dispatch({ type: SIGN_MANDATE_ID_CARD_START });
    const { token } = getState().login;
    let mandateId;
    let certificate;

    return hwcrypto
      .getCertificate({ lang: 'en' })
      .then(
        (cert) => {
          certificate = cert;
        },
        () => {
          const error = {
            body: { errors: [{ code: 'id.card.signing.error' }] },
          };
          dispatch({ type: SIGN_MANDATE_START_ERROR, error });
        },
      )
      .then(() => saveOrRetrieveExistingMandate(mandate, token))
      .then(({ id }) => {
        mandateId = id;
        return getIdCardSignatureHashForMandateIdWithCertificateHexAndToken(
          mandateId,
          certificate.hex,
          token,
        );
      })
      .then((hash) => {
        dispatch({ type: SIGN_MANDATE_ID_CARD_START_SUCCESS });
        dispatch(signIdCardSignatureHashWithCertificateForMandateId(hash, certificate, mandateId));
      })
      .catch((error) => {
        dispatch({ type: SIGN_MANDATE_START_ERROR, error });
      });
  };
}

export function signMandate(mandate, amlChecks) {
  return (dispatch, getState) => {
    const loggedInWithMobileId = getState().login.loginMethod === 'mobileId';
    const loggedInWithSmartId = getState().login.loginMethod === 'smartId';
    return dispatch(amlActions.createAmlChecks(amlChecks))
      .then(() => {
        if (loggedInWithMobileId) {
          return dispatch(signMandateWithMobileId(mandate));
        }
        if (loggedInWithSmartId) {
          return dispatch(signMandateWithSmartId(mandate));
        }
        return dispatch(signMandateWithIdCard(mandate));
      })
      .catch((error) => {
        handleSaveMandateError(dispatch, error);
      });
  };
}

export function cancelSigningMandate() {
  if (timeout && process.env.NODE_ENV !== 'test') {
    clearTimeout(timeout);
  }
  return { type: SIGN_MANDATE_MOBILE_ID_CANCEL };
}

export function closeErrorMessages() {
  return { type: NO_SIGN_MANDATE_ERROR };
}
