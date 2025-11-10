import download from 'downloadjs';
// TODO migrate to web-eid-library
import hwcrypto, { Certificate } from 'hwcrypto-js';

import { Dispatch } from 'react';
import { AxiosError } from 'axios';
import {
  downloadMandatePreviewWithId,
  downloadMandateWithId,
  getFunds,
  getIdCardSignatureHash,
  getIdCardSignatureStatus,
  getMobileIdSignatureChallengeCode,
  getMobileIdSignatureStatus,
  getSmartIdSignatureChallengeCode,
  getSmartIdSignatureStatus,
  getSourceFunds,
  saveMandateWithAuthentication,
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
  SET_CANCELLATION_MANDATE_ID,
  SIGN_MANDATE_ERROR,
  SIGN_MANDATE_ID_CARD_SIGN_HASH_SUCCESS,
  SIGN_MANDATE_ID_CARD_START,
  SIGN_MANDATE_ID_CARD_START_SUCCESS,
  SIGN_MANDATE_IN_PROGRESS,
  SIGN_MANDATE_INVALID_ERROR,
  SIGN_MANDATE_MOBILE_ID_CANCEL,
  SIGN_MANDATE_MOBILE_ID_START,
  SIGN_MANDATE_MOBILE_ID_START_SUCCESS,
  SIGN_MANDATE_SMART_ID_START,
  SIGN_MANDATE_SMART_ID_START_SUCCESS,
  SIGN_MANDATE_START_ERROR,
  SIGN_MANDATE_SUCCESS,
} from './constants';
import { actions as amlActions } from '../aml';
import { getAuthentication } from '../common/authenticationManager';
import { RootState } from '../account/ComparisonCalculator/types';
import { Mandate } from '../common/apiModels';
import { SourceSelection } from './types';

const POLL_DELAY = 1000;

const SIGNATURE_DONE_STATUS = 'SIGNATURE';
const SIGNING_IN_PROGRESS_STATUS = 'OUTSTANDING_TRANSACTION';

let timeout: number;

export function getAllSourceFunds() {
  return (dispatch: Dispatch<unknown>) => {
    dispatch({ type: GET_SOURCE_FUNDS_START });

    return getSourceFunds()
      .then((sourceFunds) => {
        dispatch({ type: GET_SOURCE_FUNDS_SUCCESS, sourceFunds });
      })
      .catch((error) => dispatch({ type: GET_SOURCE_FUNDS_ERROR, error }));
  };
}

export function selectExchangeSources(
  sourceSelection: SourceSelection[],
  sourceSelectionExact = false,
) {
  return {
    type: SELECT_EXCHANGE_SOURCES,
    sourceSelection,
    sourceSelectionExact,
  };
}

export function changeAgreementToTerms(agreement: boolean) {
  return { type: CHANGE_AGREEMENT_TO_TERMS, agreement };
}

export function downloadMandate() {
  return (_: unknown, getState: () => RootState) => {
    const mandateId = getState().exchange.signedMandateId;
    if (mandateId && getAuthentication().isAuthenticated()) {
      return downloadMandateWithId(mandateId.toString()).then((file) =>
        download(file, 'Tuleva_avaldus.bdoc', 'application/bdoc'),
      );
    }
    return Promise.resolve();
  };
}

export function getTargetFunds() {
  return (dispatch: Dispatch<unknown>) => {
    dispatch({ type: GET_TARGET_FUNDS_START });
    return getFunds()
      .then((targetFunds) => dispatch({ type: GET_TARGET_FUNDS_SUCCESS, targetFunds }))
      .catch((error) => dispatch({ type: GET_TARGET_FUNDS_ERROR, error }));
  };
}

export function selectFutureContributionsFund(targetFundIsin: string | null) {
  return { type: SELECT_TARGET_FUND, targetFundIsin };
}

function pollForMobileIdSignature(mandateId: number, pillar: 2 | 3) {
  return (dispatch: Dispatch<unknown>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = window.setTimeout(() => {
      getMobileIdSignatureStatus({ entityId: mandateId.toString() })
        .then((status) => {
          if (status.statusCode === SIGNING_IN_PROGRESS_STATUS) {
            dispatch({
              type: SIGN_MANDATE_IN_PROGRESS,
              controlCode: status.challengeCode,
            });
            dispatch(pollForMobileIdSignature(mandateId, pillar));
          } else {
            dispatch({
              type: SIGN_MANDATE_SUCCESS,
              signedMandateId: mandateId,
              pillar,
            });
          }
        })
        .catch((error) => dispatch({ type: SIGN_MANDATE_ERROR, error }));
    }, POLL_DELAY);
  };
}

function pollForSmartIdSignature(mandateId: number, pillar: 2 | 3) {
  return (dispatch: Dispatch<unknown>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = window.setTimeout(() => {
      getSmartIdSignatureStatus({ entityId: mandateId.toString() })
        .then((status) => {
          if (status.statusCode === SIGNING_IN_PROGRESS_STATUS) {
            dispatch({
              type: SIGN_MANDATE_IN_PROGRESS,
              controlCode: status.challengeCode,
            });
            dispatch(pollForSmartIdSignature(mandateId, pillar));
          } else {
            dispatch({
              type: SIGN_MANDATE_SUCCESS,
              signedMandateId: mandateId,
              pillar,
            });
          }
        })
        .catch((error) => dispatch({ type: SIGN_MANDATE_ERROR, error }));
    }, POLL_DELAY);
  };
}

// should be AxiosError though status
function handleSaveMandateError(dispatch: Dispatch<unknown>, error: unknown) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (error?.status === 400) {
    dispatch({ type: SIGN_MANDATE_INVALID_ERROR, error });
  } else {
    dispatch({ type: SIGN_MANDATE_START_ERROR, error });
  }
}

export function previewMandate(mandate: Mandate, amlChecks?: unknown) {
  return (dispatch: Dispatch<unknown>) => {
    const amlChecksPromise = dispatch(
      amlActions.createAmlChecks(amlChecks),
    ) as unknown as Promise<unknown>;

    return amlChecksPromise
      .then(() => saveOrRetrieveExistingMandate(mandate))
      .then(({ id }: Mandate) => downloadMandatePreviewWithId(id.toString()))
      .then((file: Blob) => download(file, 'Tuleva_avaldus_eelvaade.zip', 'application/zip'))
      .catch((error: string) => {
        handleSaveMandateError(dispatch, error);
      });
  };
}

export function signMandateWithMobileId(mandate: Mandate) {
  return (dispatch: Dispatch<unknown>) => {
    dispatch({ type: SIGN_MANDATE_MOBILE_ID_START });
    let mandateId: number;
    let mandatePillar: 2 | 3;

    return saveOrRetrieveExistingMandate(mandate)
      .then(({ id, pillar }) => {
        mandateId = id;
        mandatePillar = pillar;
        return getMobileIdSignatureChallengeCode({ entityId: mandateId.toString() });
      })
      .then((controlCode) => {
        dispatch({ type: SIGN_MANDATE_MOBILE_ID_START_SUCCESS, controlCode });
        dispatch(pollForMobileIdSignature(mandateId, mandatePillar));
      })
      .catch((error) => {
        handleSaveMandateError(dispatch, error);
      });
  };
}

export function signMandateWithSmartId(mandate: Mandate) {
  return (dispatch: Dispatch<unknown>) => {
    dispatch({ type: SIGN_MANDATE_SMART_ID_START });
    let mandateId: number;
    let mandatePillar: 2 | 3;
    return saveOrRetrieveExistingMandate(mandate)
      .then(({ id, pillar }) => {
        mandateId = id;
        mandatePillar = pillar;
        return getSmartIdSignatureChallengeCode({ entityId: mandateId.toString() });
      })
      .then((controlCode) => {
        dispatch({ type: SIGN_MANDATE_SMART_ID_START_SUCCESS, controlCode });
        dispatch(pollForSmartIdSignature(mandateId, mandatePillar));
      })
      .catch((error) => {
        handleSaveMandateError(dispatch, error);
      });
  };
}

function pollForIdCardSignature(mandateId: number, pillar: 2 | 3, signedHash: string) {
  return (dispatch: Dispatch<unknown>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = window.setTimeout(() => {
      getIdCardSignatureStatus({ entityId: mandateId.toString(), signedHash })
        .then((statusCode) => {
          if (statusCode === SIGNATURE_DONE_STATUS) {
            dispatch({
              type: SIGN_MANDATE_SUCCESS,
              signedMandateId: mandateId,
              pillar,
            });
          } else if (statusCode === SIGNING_IN_PROGRESS_STATUS) {
            dispatch(pollForIdCardSignature(mandateId, pillar, signedHash));
          } else {
            dispatch({ type: SIGN_MANDATE_ERROR, statusCode });
          }
        })
        .catch((error) => dispatch({ type: SIGN_MANDATE_ERROR, error }));
    }, POLL_DELAY);
  };
}

function signIdCardSignatureHash(
  hash: string,
  certificate: Certificate,
  mandateId: number,
  pillar: 2 | 3,
) {
  return (dispatch: Dispatch<unknown>) =>
    hwcrypto
      .sign(certificate, { type: 'SHA-256', hex: hash }, { lang: 'en' })
      .then(
        (signature: { hex: string }) => {
          dispatch({ type: SIGN_MANDATE_ID_CARD_SIGN_HASH_SUCCESS });
          return signature.hex;
        },
        (error: string) => {
          dispatch({ type: SIGN_MANDATE_ERROR, error });
        },
      )
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .then((signedHash: string) => {
        dispatch(pollForIdCardSignature(mandateId, pillar, signedHash));
      })
      .catch((error: string) => {
        handleSaveMandateError(dispatch, error);
      });
}

function saveOrRetrieveExistingMandate(mandate: Mandate | string) {
  if (typeof mandate === 'object' && mandate.id) {
    return Promise.resolve(mandate);
  }
  return saveMandateWithAuthentication(mandate as string);
}

export function signMandateWithIdCard(mandate: Mandate) {
  return (dispatch: Dispatch<unknown>) => {
    dispatch({ type: SIGN_MANDATE_ID_CARD_START });
    let mandateId: number;
    let mandatePillar: 2 | 3;
    let certificate: Certificate;

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
      .then(() => saveOrRetrieveExistingMandate(mandate))
      .then(({ id, pillar }: Mandate) => {
        mandateId = id;
        mandatePillar = pillar;
        return getIdCardSignatureHash({
          entityId: mandateId.toString(),
          certificateHex: certificate.hex,
        });
      })
      .then((hash: string) => {
        dispatch({ type: SIGN_MANDATE_ID_CARD_START_SUCCESS });
        dispatch(signIdCardSignatureHash(hash, certificate, mandateId, mandatePillar));
      })
      .catch((error: string) => {
        dispatch({ type: SIGN_MANDATE_START_ERROR, error });
      });
  };
}

export function signMandate(mandate: Mandate, amlChecks?: unknown) {
  return (dispatch: Dispatch<unknown>) => {
    const { signingMethod } = getAuthentication();
    const amlChecksPromise = dispatch(
      amlActions.createAmlChecks(amlChecks),
    ) as unknown as Promise<unknown>;

    return amlChecksPromise
      .then(() => {
        if (signingMethod === 'MOBILE_ID') {
          return dispatch(signMandateWithMobileId(mandate));
        }
        if (signingMethod === 'SMART_ID') {
          return dispatch(signMandateWithSmartId(mandate));
        }
        if (signingMethod === 'ID_CARD') {
          return dispatch(signMandateWithIdCard(mandate));
        }
        throw new Error(`Invalid signing method: ${signingMethod}`);
      })
      .catch((error: AxiosError) => {
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

export function setCancellationMandateId(mandateId: number | null) {
  return { type: SET_CANCELLATION_MANDATE_ID, mandateId };
}
