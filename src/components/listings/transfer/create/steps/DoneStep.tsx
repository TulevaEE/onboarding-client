import { Redirect, useHistory } from 'react-router-dom';
import { SuccessAlert } from '../../../../common/successAlert';
import { useCreateCapitalTransferContext } from '../hooks';

export const DoneStep = () => {
  const history = useHistory();
  const { buyer, bookValue, totalPrice, sellerIban, createdCapitalTransferContract } =
    useCreateCapitalTransferContext();

  if (!bookValue || !totalPrice || !sellerIban || !buyer) {
    return <Redirect to="/capital/transfer/create" />;
  }

  if (!createdCapitalTransferContract) {
    // eslint-disable-next-line no-console
    console.error('No capital contract present in done step');
    return <Redirect to="/capital/listings" />;
  }

  return (
    <SuccessAlert>
      <div className="d-flex flex-column gap-4">
        <div className="d-flex flex-column gap-3">
          <h2 className="m-0">Leping on sinu poolt allkirjastatud</h2>
          <p className="m-0">Teavitasime ostjat ja leping on nüüd tema allkirjastamise ootel.</p>
        </div>

        <div className="d-flex justify-content-center gap-2">
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => {
              history.push(`/capital/transfer/${createdCapitalTransferContract.id}`);
            }}
          >
            Vaatan staatust
          </button>
        </div>
      </div>
    </SuccessAlert>
  );
};
