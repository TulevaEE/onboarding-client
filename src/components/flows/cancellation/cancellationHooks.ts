import React from 'react';
import { useApplicationCancellation } from '../../common/apiHooks';
import { useMandatePreview, useMandateSigning } from '../../exchange/hooks';

export function useCancellationWithSigning(): {
  cancelApplication: (applicationId: number) => Promise<number>;
  cancelSigning: () => void;
  cancellationMandateId: number | null;
  signedMandateId: number | null;
  loading: boolean;
  challengeCode: string | null;
} {
  const mutation = useApplicationCancellation();
  const signing = useMandateSigning();
  const [persistedMandateId, setPersistedMandateId] = React.useState<number | null>(null);

  async function cancelApplication(applicationId: number): Promise<number> {
    const cancellation = await mutation.mutateAsync(applicationId);
    setPersistedMandateId(cancellation.mandateId);
    signing.sign({ id: cancellation.mandateId, pillar: 2 });
    return cancellation.mandateId;
  }

  function cancelSigning() {
    setPersistedMandateId(null);
    signing.cancel();
  }

  return {
    cancelApplication,
    cancelSigning,
    cancellationMandateId: persistedMandateId,
    signedMandateId: signing.signedMandateId,
    loading: mutation.isLoading || signing.loading,
    challengeCode: signing.challengeCode,
  };
}

export function useCancellationPreview(): {
  downloadPreview: (applicationId: number) => void;
} {
  const mutation = useApplicationCancellation();
  const preview = useMandatePreview();

  async function downloadPreview(applicationId: number) {
    const cancellation = await mutation.mutateAsync(applicationId);
    preview.downloadPreview({ id: cancellation.mandateId, pillar: 2 });
  }

  return {
    downloadPreview,
  };
}
