import { useHistory, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useCapitalTransferContract, useMe } from '../../../common/apiHooks';
import { Loader } from '../../../common';
import { ContractDetails } from '../components/ContractDetails';
import { getContractDetailsPropsFromContract, getMyRole } from './utils';
import { BuyerFlow } from './buyer/BuyerFlow';
import { SellerConfirm } from './seller/SellerConfirm';
import { CapitalTransferContract } from '../../../common/apiModels/capital-transfer';

export const CapitalTransferStatus = () => {
  const params = useParams<{ id: string }>();

  const { data: me } = useMe();

  // TODO while signing or confirming disable this
  const [manualFetching] = useState(false);
  const { data: contract, refetch } = useCapitalTransferContract(Number(params.id), manualFetching);

  if (!me || !contract) {
    return <Loader className="align-middle" />;
  }

  const myRole = getMyRole(me, contract);

  const showBuyerFlow =
    (contract.state === 'SELLER_SIGNED' || contract.state === 'BUYER_SIGNED') && myRole === 'BUYER';

  const showSellerConfirmation =
    contract.state === 'PAYMENT_CONFIRMED_BY_BUYER' && myRole === 'SELLER';

  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto d-flex flex-column gap-5">
      {showBuyerFlow && <BuyerFlow contract={contract} onRefetch={() => refetch()} />}
      {showSellerConfirmation && (
        <SellerConfirm contract={contract} onConfirmed={() => refetch()} />
      )}
      {!showBuyerFlow && !showSellerConfirmation && <StatusDisplay contract={contract} />}
    </div>
  );
};

const StatusDisplay = ({ contract }: { contract: CapitalTransferContract }) => {
  const { data: me } = useMe();
  const history = useHistory();

  if (!me) {
    return <Loader className="align-middle" />;
  }

  return (
    <>
      {contract.state === 'CANCELLED' && (
        <div className="alert alert-warning">TODO Avaldus on tühistatud</div>
      )}
      {contract.state === 'PAYMENT_CONFIRMED_BY_SELLER' && (
        <div className="alert alert-info d-flex">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            viewBox="0 0 16 16"
            aria-hidden="true"
          >
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
            <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
          </svg>
          Avaldus on saadetud Tuleva ühistu juhatusele. Vaatame avalduse läbi ühe nädala jooksul ja
          teavitame osapooli otsusest meiliga.
        </div>
      )}

      {contract.state === 'APPROVED' && (
        <div className="alert alert-success">
          TODO Avaldus on kinnitatud Tuleva ühistu juhatuse poolt.
        </div>
      )}

      <h1 className="m-0">Liikmekapitali võõrandamise avaldus</h1>

      <div className="py-4">
        <ContractDetails
          {...getContractDetailsPropsFromContract(contract)}
          userRole={getMyRole(me, contract)}
        />
      </div>

      <div className="d-flex flex-column-reverse flex-sm-row justify-content-between pt-4 border-top gap-3">
        <button
          type="button"
          className="btn btn-lg btn-light"
          onClick={() => history.push('/capital/listings/')}
        >
          Tagasi
        </button>
      </div>
    </>
  );
};
