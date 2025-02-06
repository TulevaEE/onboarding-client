import { useEffect, useRef, useState } from 'react';
import { MandateBatchDto } from '../../../common/apiModels/withdrawals';
import { getAuthentication } from '../../../common/authenticationManager';
import { pollForSignatureStatus, startSigningWithChallengeCode } from './signWithChallengeCode';
import {
  persistSignedIdCardHex,
  pollForBatchStatusSignedWithIdCard,
  SignedMandateBatch,
  signWithIdCard,
} from './signWithIdCard';
import { ErrorResponse } from '../../../common/apiModels';

const POLL_DELAY = 1000;
const SIGNATURE_DONE_STATUS = 'SIGNATURE';

export const useMandateBatchSigning = () => {
  const pollTimeout = useRef<number | null>(null);

  const [challengeCode, setChallengeCode] = useState<string | null>(null);
  const [signingType, setSigningType] = useState<'MOBILE_ID' | 'SMART_ID' | 'ID_CARD' | null>(null);

  const [signed, setSigned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorResponse | null>(null);

  useEffect(() => {
    if (error) {
      setSigned(false);
      setChallengeCode(null);
    }
  }, [error]);

  useEffect(() => {
    if (signed) {
      setLoading(false);
      setChallengeCode(null);
    }
  }, [signed]);

  const startSigningMandateBatch = async (mandateBatch: MandateBatchDto) => {
    const { signingMethod } = getAuthentication();
    try {
      setLoading(true);
      if (signingMethod === 'ID_CARD') {
        setSigningType('ID_CARD');
        const signature = await signWithIdCard(mandateBatch);
        await persistSignedIdCardHex(signature);
        pollForIdCard(signature);
      } else if (signingMethod === 'SMART_ID' || signingMethod === 'MOBILE_ID') {
        setSigningType(signingMethod);
        setChallengeCode(
          (await startSigningWithChallengeCode(mandateBatch, signingMethod)) ?? null,
        );
        poll(mandateBatch, signingMethod);
      } else {
        throw new Error(`Invalid signing method: ${signingMethod}`);
      }
    } catch (e) {
      setError(e as ErrorResponse); // TODO
      return Promise.reject(e);
    }

    return Promise.resolve();
  };

  // PUT id card status method requires signed hex every time, so this is split from other polling method
  const pollForIdCard = (signedMandateBatch: SignedMandateBatch) => {
    resetCurrentPolling();

    pollTimeout.current = window.setTimeout(async () => {
      try {
        const signatureStatus = await pollForBatchStatusSignedWithIdCard(signedMandateBatch);

        if (signatureStatus === SIGNATURE_DONE_STATUS) {
          setSigned(true);
        } else {
          pollForIdCard(signedMandateBatch);
        }
      } catch (e) {
        setError(e as ErrorResponse); // TODO
      }
    }, POLL_DELAY);
  };

  const poll = (mandateBatch: MandateBatchDto, signingMethod: 'MOBILE_ID' | 'SMART_ID') => {
    resetCurrentPolling();

    pollTimeout.current = window.setTimeout(async () => {
      try {
        const signatureStatus = await pollForSignatureStatus(mandateBatch, signingMethod);
        setChallengeCode(signatureStatus.challengeCode);

        if (signatureStatus.statusCode === SIGNATURE_DONE_STATUS) {
          setSigned(true);
        } else {
          poll(mandateBatch, signingMethod);
        }
      } catch (e) {
        setError(e as ErrorResponse); // TODO
      }
    }, POLL_DELAY);
  };

  const resetCurrentPolling = () => {
    if (pollTimeout.current) {
      clearTimeout(pollTimeout.current);
    }
  };

  const cancelSigning = () => {
    // TODO cancel signing ID card as well? Mandate is already being processed then
    if (signingType === 'MOBILE_ID' || signingType === 'SMART_ID') {
      resetCurrentPolling();
      setLoading(false);
      setChallengeCode(null);
      setError(null);
    }
  };

  return {
    startSigningMandateBatch,
    cancelSigning,
    signingType,
    signed,
    loading,
    error,
    challengeCode,
  };
};
