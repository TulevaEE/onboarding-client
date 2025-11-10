import React from 'react';
import { Redirect, useParams } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { useApplication } from '../../common/apiHooks';
import { AuthenticationLoader } from '../../common';
import { Loader } from '../../common/loader/Loader';
import { ApplicationCard } from '../../account/ApplicationSection/ApplicationCards';
import { useCancellationPreview, useCancellationWithSigning } from './cancellationHooks';
import { flowPath, successPath } from './paths';

export const ConfirmCancellation: React.FunctionComponent = () => {
  const applicationId = useApplicationIdFromUrl();
  const { isLoading, data: application } = useApplication(applicationId);
  const {
    cancelApplication,
    cancelSigning,
    loading: signing,
    challengeCode,
    signedMandateId,
    cancellationMandateId,
  } = useCancellationWithSigning();
  const { downloadPreview } = useCancellationPreview();

  function confirmCancellation() {
    cancelApplication(applicationId);
  }

  function previewCancellation() {
    downloadPreview(applicationId);
  }

  if (isLoading || !application) {
    return <Loader className="align-middle" />;
  }

  if (signedMandateId && signedMandateId === cancellationMandateId) {
    const successUrl = `${flowPath.replace(
      ':applicationId',
      applicationId.toString(),
    )}/${successPath}`;
    return <Redirect to={successUrl} />;
  }

  return (
    <>
      {(signing || challengeCode) && (
        <AuthenticationLoader controlCode={challengeCode} onCancel={cancelSigning} overlayed />
      )}
      <p>
        <FormattedMessage id="cancellation.flow.confirm.content" />
      </p>
      <ApplicationCard application={application} />
      <div className="mt-5 d-flex flex-wrap align-items-center gap-2">
        <button type="button" id="sign" className="btn btn-primary" onClick={confirmCancellation}>
          <FormattedMessage id="confirm.mandate.sign" />
        </button>
        <button
          type="button"
          id="preview"
          className="btn btn-outline-primary"
          onClick={previewCancellation}
        >
          <FormattedMessage id="confirm.mandate.preview" />
        </button>
      </div>
    </>
  );
};

function useApplicationIdFromUrl(): number {
  const { applicationId } = useParams<{ applicationId: string }>();
  return parseInt(applicationId, 10);
}
