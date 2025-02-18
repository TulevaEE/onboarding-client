import React, { useState } from 'react';
import { Redirect, useParams } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { useApplication } from '../../common/apiHooks';
import { AuthenticationLoader } from '../../common';
import { Loader } from '../../common/loader/Loader';
import { ApplicationCard } from '../../account/ApplicationSection/ApplicationCards';
import { useCancellationPreview, useCancellationWithSigning } from './cancellationHooks';
import { EarlyWithdrawalApplication } from '../../common/apiModels';

export const ConfirmCancellation: React.FunctionComponent = () => {
  const applicationId = useApplicationIdFromUrl();
  // const { isLoading, data: application } = useApplication(applicationId);

  const isLoading = false;
  const application: EarlyWithdrawalApplication = {
    id: 1,
    status: 'PENDING',
    creationTime: new Date().toISOString(),
    type: 'EARLY_WITHDRAWAL',
    details: {
      depositAccountIBAN: 'EE_TEST_IBAN',
      cancellationDeadline: '2025-03-31',
      fulfillmentDate: '2025-03-31',
    },
  };

  const [signing, setSigning] = useState(false);
  const [challengeCode, setChallengeCode] = useState('');

  const {
    cancelApplication,
    cancelSigning,
    // loading: signing,
    // challengeCode,
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
    return <Redirect to={`/applications/${applicationId}/cancellation/success`} />;
  }

  return (
    <>
      {(signing || challengeCode) && (
        <AuthenticationLoader
          controlCode={challengeCode}
          onCancel={() => {
            setSigning(false);
            setChallengeCode('');
          }}
          overlayed
        />
      )}
      <p>
        <FormattedMessage id="cancellation.flow.confirm.content" />
      </p>
      <ApplicationCard application={application} />
      <div className="mt-5">
        <button
          type="button"
          id="sign"
          className="btn btn-primary mb-2 me-2"
          onClick={() => {
            setSigning(true);
            setChallengeCode('1234');
          }}
        >
          <FormattedMessage id="confirm.mandate.sign" />
        </button>
        <button
          type="button"
          id="preview"
          className="btn btn-secondary mb-2 me-2"
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
