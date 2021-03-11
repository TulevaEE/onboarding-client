import React, { useEffect } from 'react';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Message } from 'retranslate';
import { Mandate } from '../../common/apiModels';
import { cancelSigningMandate, previewMandate, signMandate } from '../../exchange/actions';
import { useApplication, useApplicationCancellation } from '../../common/apiHooks';
import { AuthenticationLoader } from '../../common';
import Loader from '../../common/loader';
import { ApplicationCard } from '../../account/ApplicationSection/ApplicationCards';
import { getSmartIdSignatureChallengeCodeForMandateIdWithToken } from '../../common/api';

export const ConfirmCancellation: React.FunctionComponent<any> = () => {
  const applicationId = useApplicationIdFromUrl();
  const { isLoading, data: application } = useApplication(applicationId);
  const {
    cancelApplication,
    cancelSigning,
    loading: signing,
    controlCode,
    signedMandateId,
  } = useCancellationWithSigning();
  const { downloadPreview } = useCancellationPreview();
  const { push } = useHistory();

  function confirmCancellation() {
    cancelApplication(applicationId);
  }

  function previewCancellation() {
    downloadPreview(applicationId);
  }

  useEffect(() => {
    if (signedMandateId) {
      push(
        `/applications/${applicationId}/cancellation/success?mandateId=${encodeURIComponent(
          signedMandateId,
        )}`,
      );
    }
  }, [signedMandateId]);

  if (isLoading || !application) {
    return <Loader className="align-middle" />;
  }

  return (
    <>
      {(signing || controlCode) && (
        <AuthenticationLoader controlCode={controlCode} onCancel={cancelSigning} overlayed />
      )}
      <p>
        <Message>cancellation.flow.confirm.content</Message>
      </p>
      <ApplicationCard application={application} />
      <div className="mt-5">
        <button
          type="button"
          id="sign"
          className="btn btn-primary mb-2 mr-2"
          onClick={confirmCancellation}
        >
          <Message>confirm.mandate.sign</Message>
        </button>
        <button
          type="button"
          id="preview"
          className="btn btn-secondary mb-2 mr-2"
          onClick={previewCancellation}
        >
          <Message>confirm.mandate.preview</Message>
        </button>
      </div>
    </>
  );
};

function useApplicationIdFromUrl(): number {
  const { applicationId } = useParams<{ applicationId: string }>();
  return parseInt(applicationId, 10);
}

function useCancellationWithSigning() {
  const mutation = useApplicationCancellation();
  const signing = useMandateSigning();

  async function cancelApplication(applicationId: number) {
    const cancellation = await mutation.mutateAsync(applicationId);
    signing.sign({ id: cancellation.mandateId });
  }

  function cancelSigning() {
    signing.cancel();
  }

  return {
    cancelApplication,
    cancelSigning,
    signedMandateId: signing.signedMandateId,
    loading: mutation.isLoading || signing.loading,
    controlCode: signing.controlCode,
  };
}

function useCancellationPreview() {
  const mutation = useApplicationCancellation();
  const preview = useMandatePreview();

  async function downloadPreview(applicationId: number) {
    const cancellation = await mutation.mutateAsync(applicationId);
    preview.downloadPreview({ id: cancellation.mandateId });
  }

  return {
    downloadPreview,
  };
}

function useMandateSigning() {
  const { controlCode, loading, signedMandateId } = useSelector<
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
    controlCode,
  };
}

function useMandatePreview() {
  const dispatch = useDispatch();
  function downloadPreview(mandate: Mandate) {
    dispatch(previewMandate(mandate));
  }

  return {
    downloadPreview,
  };
}
