import { useDispatch, useSelector } from 'react-redux';
import { useApplicationCancellation } from '../../common/apiHooks';
import { setCancellationMandateId } from '../../exchange/actions';
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
  const dispatch = useDispatch();
  const cancellationMandateId = useSelector<
    { exchange: { cancellationMandateId: number | null } },
    number | null
  >((state) => state.exchange.cancellationMandateId);

  async function cancelApplication(applicationId: number): Promise<number> {
    const cancellation = await mutation.mutateAsync(applicationId);
    dispatch(setCancellationMandateId(cancellation.mandateId));
    signing.sign({ id: cancellation.mandateId, pillar: 2 });
    return cancellation.mandateId;
  }

  function cancelSigning() {
    dispatch(setCancellationMandateId(null));
    signing.cancel();
  }

  return {
    cancelApplication,
    cancelSigning,
    cancellationMandateId,
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
