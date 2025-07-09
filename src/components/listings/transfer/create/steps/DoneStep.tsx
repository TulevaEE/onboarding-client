import { Link, Redirect, useHistory } from 'react-router-dom';
import { SuccessAlert } from '../../../../common/successAlert';
import { useCreateCapitalTransferContext } from '../hooks';

export const DoneStep = () => {
  const history = useHistory();
  const { buyer, unitCount, pricePerUnit, sellerIban } = useCreateCapitalTransferContext();

  if (!unitCount || !pricePerUnit || !sellerIban || !buyer) {
    return <Redirect to="/capital/transfer/create" />;
  }

  return (
    <SuccessAlert>
      <h2 className="py-2">Leping on sinu poolt allkirjastatud</h2>

      <div className="pb-2">Teavitasime ostjat ja leping on nüüd tema allkirjastamise ootel.</div>

      <button
        type="button"
        className="btn btn-outline-primary my-3"
        onClick={() => {
          history.push('/capital/transfer/123');
        }}
      >
        Vaatan staatust
      </button>
    </SuccessAlert>
  );
};
