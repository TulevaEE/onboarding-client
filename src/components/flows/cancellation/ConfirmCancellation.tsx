import React from 'react';
import { Redirect, useParams, useHistory } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { useSelector } from 'react-redux';
import { useApplication } from '../../common/apiHooks';
import { AuthenticationLoader } from '../../common';
import { Loader } from '../../common/loader/Loader';
import { ApplicationCard } from '../../account/ApplicationSection/ApplicationCards';
import { useCancellationPreview, useCancellationWithSigning } from './cancellationHooks';
import { flowPath, successPath } from './paths';

export const ConfirmCancellation: React.FunctionComponent = () => {
  const applicationId = useApplicationIdFromUrl();
  const history = useHistory();
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

  // BRUTE FORCE: Poll Redux directly and force redirect when signing completes
  const reduxSignedMandateId = useSelector(
    (state: { exchange?: { signedMandateId: number | null } }) => state.exchange?.signedMandateId,
  );
  const [localCancellationMandateId, setLocalCancellationMandateId] = React.useState<number | null>(
    null,
  );
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  // Store the cancellation mandate ID when it's created
  React.useEffect(() => {
    if (cancellationMandateId && !localCancellationMandateId) {
      setLocalCancellationMandateId(cancellationMandateId);
    }
  }, [cancellationMandateId, localCancellationMandateId]);

  // Force re-render every second while signing to catch Redux updates
  React.useEffect(() => {
    if (signing || challengeCode) {
      const interval = setInterval(() => {
        forceUpdate();
      }, 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [signing, challengeCode]);

  // Force redirect when Redux signing completes
  React.useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('CANCELLATION DEBUG:', {
      reduxSignedMandateId,
      localCancellationMandateId,
      cancellationMandateId,
      signedMandateId,
      signing,
      challengeCode,
      match: reduxSignedMandateId === localCancellationMandateId,
    });

    if (
      reduxSignedMandateId &&
      localCancellationMandateId &&
      reduxSignedMandateId === localCancellationMandateId
    ) {
      const successUrl = `${flowPath.replace(
        ':applicationId',
        applicationId.toString(),
      )}/${successPath}`;
      // eslint-disable-next-line no-console
      console.log('REDIRECTING TO:', successUrl);
      history.push(successUrl);
    }
  }, [
    reduxSignedMandateId,
    localCancellationMandateId,
    cancellationMandateId,
    signedMandateId,
    signing,
    challengeCode,
    applicationId,
    history,
  ]);

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
