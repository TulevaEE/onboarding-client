import { Redirect, useHistory } from 'react-router-dom';
import { SuccessAlert } from '../../../../common/successAlert';
import { useCreateCapitalTransferContext } from '../hooks';

export const DoneStep = () => {
  const history = useHistory();
  const { buyer, unitCount, totalPrice, sellerIban, createdCapitalTransferContract } =
    useCreateCapitalTransferContext();

  if (!unitCount || !totalPrice || !sellerIban || !buyer) {
    return <Redirect to="/capital/transfer/create" />;
  }

  if (!createdCapitalTransferContract) {
    // eslint-disable-next-line no-console
    console.error('No capital contract present in done step');
    return <Redirect to="/capital/listings" />;
  }

  return (
    <SuccessAlert>
      <h2 className="py-2">Leping on sinu poolt allkirjastatud</h2>

      <div className="pb-2">Teavitasime ostjat ja leping on nüüd tema allkirjastamise ootel.</div>

      <button
        type="button"
        className="btn btn-outline-primary my-3"
        onClick={() => {
          history.push(`/capital/transfer/${createdCapitalTransferContract.id}`);
        }}
      >
        Vaatan staatust
      </button>
    </SuccessAlert>
  );
};
