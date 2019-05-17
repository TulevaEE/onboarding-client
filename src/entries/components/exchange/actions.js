import { push } from 'connected-react-router';
import download from 'downloadjs';
import hwcrypto from 'hwcrypto-js';

import {
  downloadMandateWithIdAndToken,
  getIdCardSignatureHashForMandateIdWithCertificateHexAndToken,
  getIdCardSignatureStatusForMandateIdWithSignedHashAndToken,
  getMobileIdSignatureChallengeCodeForMandateIdWithToken,
  getMobileIdSignatureStatusForMandateIdWithToken,
  getSourceFundsWithToken,
  getTargetFundsWithToken,
  saveMandateWithToken,
  downloadMandatePreviewWithIdAndToken,
  getPendingExchangesWithToken,
  getSmartIdSignatureChallengeCodeForMandateIdWithToken,
  getSmartIdSignatureStatusForMandateIdWithToken,
} from '../common/api';
import {
  CHANGE_AGREEMENT_TO_TERMS,
  GET_SOURCE_FUNDS_ERROR,
  GET_SOURCE_FUNDS_START,
  GET_SOURCE_FUNDS_SUCCESS,
  GET_TARGET_FUNDS_ERROR,
  GET_TARGET_FUNDS_START,
  GET_TARGET_FUNDS_SUCCESS,
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
  NO_SIGN_MANDATE_ERROR,
  GET_PENDING_EXCHANGES_START,
  GET_PENDING_EXCHANGES_SUCCESS,
  GET_PENDING_EXCHANGES_ERROR,
} from './constants';

const POLL_DELAY = 1000;

const SIGNATURE_DONE_STATUS = 'SIGNATURE';
const SIGNING_IN_PROGRESS_STATUS = 'OUTSTANDING_TRANSACTION';

let timeout;

export function getSourceFunds() {
  return async (dispatch, getState) => {
    dispatch({ type: GET_SOURCE_FUNDS_START });

    try {
      const sourceFunds = await getSourceFundsWithToken(getState().login.token);
      if (sourceFunds.length === 0) {
        dispatch(push('/account'));
      }
      dispatch({ type: GET_SOURCE_FUNDS_SUCCESS, sourceFunds });
    } catch (error) {
      dispatch({ type: GET_SOURCE_FUNDS_ERROR, error });
    }
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
  return async (dispatch, getState) => {
    const mandateId = getState().exchange.signedMandateId;
    const { token } = getState().login;

    if (mandateId && token) {
      const file = await downloadMandateWithIdAndToken(mandateId, token);

      return download(file, 'Tuleva_avaldus.bdoc', 'application/bdoc');
    }
    return Promise.resolve();
  };
}

export function getTargetFunds() {
  return async (dispatch, getState) => {
    dispatch({ type: GET_TARGET_FUNDS_START });

    try {
      const targetFunds = await getTargetFundsWithToken(getState().login.token);
      dispatch({ type: GET_TARGET_FUNDS_SUCCESS, targetFunds });
    } catch (error) {
      dispatch({ type: GET_TARGET_FUNDS_ERROR, error });
    }
  };
}

export function selectFutureContributionsFund(targetFundIsin) {
  return { type: SELECT_TARGET_FUND, targetFundIsin };
}

function pollForMandateSignatureWithMandateId(mandateId) {
  return (dispatch, getState) => {
    if (timeout && process.env.NODE_ENV !== 'test') {
      clearTimeout(timeout);
    }
    timeout = setTimeout(async () => {
      try {
        const statusCode = await getMobileIdSignatureStatusForMandateIdWithToken(
          mandateId,
          getState().login.token,
        );
        if (statusCode === SIGNING_IN_PROGRESS_STATUS) {
          dispatch(pollForMandateSignatureWithMandateId(mandateId));
        } else {
          dispatch({
            type: SIGN_MANDATE_SUCCESS,
            signedMandateId: mandateId,
          });
          dispatch(push('/2nd-pillar-flow/success'));
        }
      } catch (error) {
        dispatch({ type: SIGN_MANDATE_ERROR, error });
      }
    }, POLL_DELAY);
  };
}

function pollForMandateSignatureWithMandateIdUsingSmartId(mandateId) {
  return (dispatch, getState) => {
    if (timeout && process.env.NODE_ENV !== 'test') {
      clearTimeout(timeout);
    }
    timeout = setTimeout(async () => {
      try {
        const statusCode = await getSmartIdSignatureStatusForMandateIdWithToken(
          mandateId,
          getState().login.token,
        );

        if (statusCode === SIGNING_IN_PROGRESS_STATUS) {
          dispatch(pollForMandateSignatureWithMandateIdUsingSmartId(mandateId));
        } else {
          dispatch({
            type: SIGN_MANDATE_SUCCESS,
            signedMandateId: mandateId,
          });
          dispatch(push('/2nd-pillar-flow/success'));
        }
      } catch (error) {
        dispatch({ type: SIGN_MANDATE_ERROR, error });
      }
    }, POLL_DELAY);
  };
}

function handleSaveMandateError(dispatch, error) {
  if (error.status === 400) {
    dispatch({ type: SIGN_MANDATE_INVALID_ERROR, error });
  } else {
    dispatch({ type: SIGN_MANDATE_START_ERROR, error });
  }
}

export function previewMandate(mandate) {
  return async (dispatch, getState) => {
    const { token } = getState().login;

    try {
      const { id } = await saveMandateWithToken(mandate, token);
      const file = await downloadMandatePreviewWithIdAndToken(id, token);
      return download(file, 'Tuleva_avaldus_eelvaade.zip', 'application/zip');
    } catch (error) {
      return handleSaveMandateError(dispatch, error);
    }
  };
}

export function signMandateWithMobileId(mandate) {
  return async (dispatch, getState) => {
    dispatch({ type: SIGN_MANDATE_MOBILE_ID_START });
    const { token } = getState().login;

    try {
      const { id: mandateId } = await saveMandateWithToken(mandate, token);
      const controlCode = await getMobileIdSignatureChallengeCodeForMandateIdWithToken(
        mandateId,
        token,
      );
      dispatch({ type: SIGN_MANDATE_MOBILE_ID_START_SUCCESS, controlCode });
      dispatch(pollForMandateSignatureWithMandateId(mandateId));
    } catch (error) {
      handleSaveMandateError(dispatch, error);
    }
  };
}

export function signMandateWithSmartId(mandate) {
  return async (dispatch, getState) => {
    dispatch({ type: SIGN_MANDATE_MOBILE_ID_START });
    const { token } = getState().login;

    try {
      const { id: mandateId } = await saveMandateWithToken(mandate, token);
      const controlCode = await getSmartIdSignatureChallengeCodeForMandateIdWithToken(
        mandateId,
        token,
      );
      dispatch({ type: SIGN_MANDATE_MOBILE_ID_START_SUCCESS, controlCode });
      dispatch(pollForMandateSignatureWithMandateIdUsingSmartId(mandateId));
    } catch (error) {
      handleSaveMandateError(dispatch, error);
    }
  };
}

function pollForMandateSignatureWithMandateIdAndSignedHash(mandateId, signedHash) {
  return (dispatch, getState) => {
    if (timeout && process.env.NODE_ENV !== 'test') {
      clearTimeout(timeout);
    }
    timeout = setTimeout(async () => {
      try {
        const statusCode = await getIdCardSignatureStatusForMandateIdWithSignedHashAndToken(
          mandateId,
          signedHash,
          getState().login.token,
        );

        if (statusCode === SIGNATURE_DONE_STATUS) {
          dispatch({
            type: SIGN_MANDATE_SUCCESS,
            signedMandateId: mandateId,
          });
          dispatch(push('/2nd-pillar-flow/success'));
        } else if (statusCode === SIGNING_IN_PROGRESS_STATUS) {
          dispatch(pollForMandateSignatureWithMandateIdAndSignedHash(mandateId, signedHash));
        } else {
          dispatch({ type: SIGN_MANDATE_ERROR, statusCode });
        }
      } catch (error) {
        dispatch({ type: SIGN_MANDATE_ERROR, error });
      }
    }, POLL_DELAY);
  };
}

function signIdCardSignatureHashWithCertificateForMandateId(hash, certificate, mandateId) {
  return async dispatch => {
    let signature;
    try {
      signature = await hwcrypto.sign(certificate, { type: 'SHA-256', hex: hash }, { lang: 'en' });
      dispatch({ type: SIGN_MANDATE_ID_CARD_SIGN_HASH_SUCCESS });
      const signedHash = signature.hex;
      try {
        dispatch(pollForMandateSignatureWithMandateIdAndSignedHash(mandateId, signedHash));
      } catch (error) {
        handleSaveMandateError(dispatch, error);
      }
    } catch (error) {
      dispatch({ type: SIGN_MANDATE_ERROR, error });
    }
  };
}

export function signMandateWithIdCard(mandate) {
  return async (dispatch, getState) => {
    dispatch({ type: SIGN_MANDATE_ID_CARD_START });
    const { token } = getState().login;

    try {
      const certificate = await hwcrypto.getCertificate({ lang: 'en' });

      try {
        const { id: mandateId } = await saveMandateWithToken(mandate, token);
        const hash = await getIdCardSignatureHashForMandateIdWithCertificateHexAndToken(
          mandateId,
          certificate.hex,
          token,
        );
        dispatch({ type: SIGN_MANDATE_ID_CARD_START_SUCCESS });
        dispatch(signIdCardSignatureHashWithCertificateForMandateId(hash, certificate, mandateId));
      } catch (error) {
        dispatch({ type: SIGN_MANDATE_START_ERROR, error });
        throw error;
      }
    } catch (e) {
      const error = {
        body: { errors: [{ code: 'id.card.signing.error' }] },
      };
      dispatch({ type: SIGN_MANDATE_START_ERROR, error });
      throw error;
    }
  };
}

export function signMandate(mandate) {
  return (dispatch, getState) => {
    const loggedInWithMobileId = getState().login.loginMethod === 'mobileId';
    const loggedInWithSmartId = getState().login.loginMethod === 'smartId';
    if (loggedInWithMobileId) {
      return dispatch(signMandateWithMobileId(mandate));
    }
    if (loggedInWithSmartId) {
      return dispatch(signMandateWithSmartId(mandate));
    }
    return dispatch(signMandateWithIdCard(mandate));
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

export function getPendingExchanges() {
  return async (dispatch, getState) => {
    dispatch({ type: GET_PENDING_EXCHANGES_START });

    try {
      const pendingExchanges = await getPendingExchangesWithToken(getState().login.token);
      dispatch({ type: GET_PENDING_EXCHANGES_SUCCESS, pendingExchanges });
    } catch (error) {
      dispatch({ type: GET_PENDING_EXCHANGES_ERROR, error });
    }
  };
}
