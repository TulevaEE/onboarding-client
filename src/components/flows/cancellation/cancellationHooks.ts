import { useApplicationCancellation } from '../../common/apiHooks';
import { useMandatePreview, useMandateSigning } from '../../exchange/hooks';

export function useCancellationWithSigning(): {
  cancelApplication: (applicationId: number) => void;
  cancelSigning: () => void;
  cancellationMandateId: number | null;
  signedMandateId: number | null;
  loading: boolean;
  challengeCode: string | null;
} {
  const mutation = useApplicationCancellation();
  const signing = useMandateSigning();

  async function cancelApplication(applicationId: number) {
    const cancellation = await mutation.mutateAsync(applicationId);
    signing.sign({ id: cancellation.mandateId, pillar: 2 });
  }

  function cancelSigning() {
    signing.cancel();
  }

  return {
    cancelApplication,
    cancelSigning,
    cancellationMandateId: mutation.data?.mandateId || null,
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
