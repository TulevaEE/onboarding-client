import { AxiosError } from 'axios';
import { useRef, useState } from 'react';
import { MandateBatchDto } from '../../../common/apiModels/withdrawals';
import { getAuthentication } from '../../../common/authenticationManager';
import { pollForSignatureStatus, startSigningWithChallengeCode } from './signWithChallengeCode';

const POLL_DELAY = 1000;
const SIGNATURE_DONE_STATUS = 'SIGNATURE';

export const useMandateBatchSigning = () => {
  const pollTimeout = useRef<number | null>(null);

  const [challengeCode, setChallengeCode] = useState<string | null>(null);

  const [signed, setSigned] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const startSigningMandate = async (mandateBatch: MandateBatchDto) => {
    const { loginMethod } = getAuthentication();
    const loggedInWithMobileId = loginMethod === 'MOBILE_ID';
    const loggedInWithSmartId = loginMethod === 'SMART_ID';
    const loggedInWithIdCard = loginMethod === 'ID_CARD';

    // TODO amlchecks?

    try {
      if (loggedInWithIdCard) {
        // TODO
      } else if (loggedInWithSmartId || loggedInWithMobileId) {
        setChallengeCode(
          (await startSigningWithChallengeCode(mandateBatch, loginMethod)).challengeCode,
        );
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

  const poll = (mandateBatch: MandateBatchDto, loginMethod: 'MOBILE_ID' | 'SMART_ID') => {
    if (pollTimeout.current) {
      clearTimeout(pollTimeout.current);
    }

    pollTimeout.current = window.setTimeout(async () => {
      try {
        const signatureStatus = await pollForSignatureStatus(mandateBatch, loginMethod);

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

  return { startSigningMandate, signed, error, challengeCode };
};
