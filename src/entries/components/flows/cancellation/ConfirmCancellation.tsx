import React, { useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Message } from 'retranslate';
import { useApplication } from '../../common/apiHooks';
import { AuthenticationLoader } from '../../common';
import Loader from '../../common/loader';
import { ApplicationCard } from '../../account/ApplicationSection/ApplicationCards';
import { useCancellationPreview, useCancellationWithSigning } from './cancellationHooks';

export const ConfirmCancellation: React.FunctionComponent = () => {
  const applicationId = useApplicationIdFromUrl();
  const { isLoading, data: application } = useApplication(applicationId);
  const {
    cancelApplication,
    cancelSigning,
    loading: signing,
    challengeCode,
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
      {(signing || challengeCode) && (
        <AuthenticationLoader controlCode={challengeCode} onCancel={cancelSigning} overlayed />
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
