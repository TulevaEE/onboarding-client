import { useDispatch, useSelector } from 'react-redux';
import { Mandate } from '../common/apiModels';
import { cancelSigningMandate, downloadMandate, previewMandate, signMandate } from './actions';

export function useMandateSigning(): {
  sign: (mandate: Mandate) => void;
  cancel: () => void;
  loading: boolean;
  signedMandateId: number | null;
  challengeCode: string | null;
} {
  const { controlCode: challengeCode, loading, signedMandateId } = useSelector<
    {
      exchange: {
        loadingMandate: boolean;
        mandateSigningControlCode: string | null;
        signedMandateId: number;
      };
    },
    { controlCode: string | null; loading: boolean; signedMandateId: number }
  >(({ exchange }) => ({
    controlCode: exchange.mandateSigningControlCode,
    loading: exchange.loadingMandate,
    signedMandateId: exchange.signedMandateId,
  }));
  const dispatch = useDispatch();

  function sign(mandate: Mandate) {
    dispatch(signMandate(mandate));
  }

  function cancel() {
    dispatch(cancelSigningMandate());
  }

  return {
    sign,
    cancel,
    loading,
    signedMandateId,
    challengeCode,
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
