import { useEffect, useRef, useState } from 'react';
import { MandateBatchDto } from '../../../common/apiModels/withdrawals';
import { getAuthentication } from '../../../common/authenticationManager';
import { pollForSignatureStatus, startSigningWithChallengeCode } from './signWithChallengeCode';
import {
  signWithIdCard,
  persistSignedIdCardHex,
  SignedMandateBatch,
  pollForBatchStatusSignedWithIdCard,
} from './signWithIdCard';

const POLL_DELAY = 1000;
const SIGNATURE_DONE_STATUS = 'SIGNATURE';

export const useMandateBatchSigning = () => {
  const pollTimeout = useRef<number | null>(null);

  const [challengeCode, setChallengeCode] = useState<string | null>(null);
  const [signingType, setSigningType] = useState<'MOBILE_ID' | 'SMART_ID' | 'ID_CARD' | null>(null);

  const [signed, setSigned] = useState(false);
  const [loading, setLoading] = useState(false);
  // TODO errors list
  const [error, setError] = useState<Error | null>(null);

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
    const { loginMethod } = getAuthentication();
    const loggedInWithMobileId = loginMethod === 'MOBILE_ID';
    const loggedInWithSmartId = loginMethod === 'SMART_ID';
    const loggedInWithIdCard = loginMethod === 'ID_CARD';

    // TODO amlchecks?

    try {
      setLoading(true);
      if (loggedInWithIdCard) {
        setSigningType('ID_CARD');
        const signature = await signWithIdCard(mandateBatch);
        await persistSignedIdCardHex(signature);
        pollForIdCard(signature);
      } else if (loggedInWithSmartId || loggedInWithMobileId) {
        setSigningType(loginMethod);
        setChallengeCode((await startSigningWithChallengeCode(mandateBatch, loginMethod)) ?? null);
        poll(mandateBatch, loginMethod);
      } else {
        throw new Error(`Invalid login method: ${loginMethod}`);
      }
    } catch (e) {
      setError(e as Error);
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
        setError(e as Error);
      }
    }, POLL_DELAY);
  };

  const poll = (mandateBatch: MandateBatchDto, loginMethod: 'MOBILE_ID' | 'SMART_ID') => {
    resetCurrentPolling();

    pollTimeout.current = window.setTimeout(async () => {
      try {
        const signatureStatus = await pollForSignatureStatus(mandateBatch, loginMethod);
        setChallengeCode(signatureStatus.challengeCode);

        if (signatureStatus.statusCode === SIGNATURE_DONE_STATUS) {
          setSigned(true);
        } else {
          poll(mandateBatch, loginMethod);
        }
      } catch (e) {
        setError(e as Error);
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
