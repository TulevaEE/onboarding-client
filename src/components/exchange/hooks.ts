import { useDispatch, useSelector } from 'react-redux';
import { ErrorResponse, Mandate } from '../common/apiModels';
import {
  cancelSigningMandate,
  closeErrorMessages,
  downloadMandate,
  previewMandate,
  signMandate,
} from './actions';

export function useMandateSigning(): {
  sign: (mandate: Mandate) => void;
  cancel: () => void;
  loading: boolean;
  signedMandateId: number | null;
  challengeCode: string | null;
  error: ErrorResponse | null;
  resetError: () => void;
} {
  const {
    controlCode: challengeCode,
    loading,
    signedMandateId,
    error,
  } = useSelector<
    {
      exchange: {
        loadingMandate: boolean;
        mandateSigningControlCode: string | null;
        signedMandateId: number;
        mandateSigningError: ErrorResponse | null;
      };
    },
    {
      controlCode: string | null;
      loading: boolean;
      signedMandateId: number;
      error: ErrorResponse | null;
    }
  >(({ exchange }) => ({
    controlCode: exchange.mandateSigningControlCode,
    loading: exchange.loadingMandate,
    signedMandateId: exchange.signedMandateId,
    error: exchange.mandateSigningError,
  }));
  const dispatch = useDispatch();

  function sign(mandate: Mandate) {
    dispatch(signMandate(mandate));
  }

  function cancel() {
    dispatch(cancelSigningMandate());
  }

  function resetError() {
    dispatch(closeErrorMessages());
  }

  return {
    sign,
    cancel,
    loading,
    signedMandateId,
    challengeCode,
    error,
    resetError,
  };
}

export function useMandatePreview(): {
  downloadPreview: (mandate: Mandate) => void;
} {
  const dispatch = useDispatch();
  function downloadPreview(mandate: Mandate) {
    dispatch(previewMandate(mandate));
  }

  return {
    downloadPreview,
  };
}

export function useSignedMandateDownload(): {
  download: () => void;
} {
  const dispatch = useDispatch();
  function download() {
    dispatch(downloadMandate());
  }

  return {
    download,
  };
}
