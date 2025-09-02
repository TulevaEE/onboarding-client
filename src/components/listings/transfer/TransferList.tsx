import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { Loader } from '../../common';
import { useMe, useMyCapitalTransferContracts } from '../../common/apiHooks';
import { User } from '../../common/apiModels';
import { CapitalTransferContract } from '../../common/apiModels/capital-transfer';
import { getFullName } from '../../common/utils';
import { getMyRole } from './status/utils';
import { isTranslationKey, TranslationKey } from '../../translations';

export const TransferList = () => {
  const { data: contracts, isLoading: isLoadingContracts } = useMyCapitalTransferContracts();
  const { data: me, isLoading: isLoadingUser } = useMe();

  if (isLoadingContracts || isLoadingUser || !me) {
    return <Loader className="align-middle" />;
  }

  const filteredContracts = (contracts ?? []).filter(
    (contract) => contract.state !== 'APPROVED' && contract.state !== 'CANCELLED',
  );

  if (filteredContracts.length === 0) {
    return null;
  }

  const sortedContracts = filteredContracts.sort((contract) => {
    const myRole = getMyRole(me, contract);
    const statusSortOrders = getStateSortOrder(myRole);

    return statusSortOrders.indexOf(contract.state) * -1; // either 0, 1 for relevant status or -1 for irrelevant status
  });

  return (
    <div className="card p-4 d-flex flex-column row-gap-2">
      <p className="m-0 fw-bold">
        {filteredContracts.length > 1 ? (
          <FormattedMessage
            id="capital.transfer.pendingMultiple"
            values={{ count: filteredContracts.length }}
          />
        ) : (
          <FormattedMessage id="capital.transfer.pendingSingle" />
        )}
      </p>
      <ul className="list-unstyled m-0">
        {sortedContracts.map((contract) => (
          <TransferItem contract={contract} me={me} key={contract.id} />
        ))}
      </ul>
    </div>
  );
};

const TransferItem = ({ contract, me }: { contract: CapitalTransferContract; me: User }) => {
  const myRole = getMyRole(me, contract);
  const pendingActionsForMyRole = getStateSortOrder(myRole);
  const isPendingOnMyAction = pendingActionsForMyRole.includes(contract.state);

  const stateDescription = getStateDescription(contract, myRole);

  if (stateDescription === null) {
    return null;
  }

  return (
    <li
      className="d-flex justify-content-between row-gap-2"
      data-testid="active-capital-transfer-contract"
      data-myrole={myRole}
      data-state={contract.state}
    >
      <span className="d-flex align-items-start column-gap-2">
        <span className="d-inline-block text-secondary" aria-hidden="true">
          {isPendingOnMyAction ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 16 16"
              className="align-top mt-1"
            >
              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 16 16"
              className="align-top mt-1"
            >
              <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z" />
              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0" />
            </svg>
          )}
        </span>
        <span>
          <FormattedMessage
            id={stateDescription}
            values={{
              buyerName: getFullName(contract.buyer),
              sellerName: getFullName(contract.seller),
            }}
          />
        </span>
      </span>
      <Link to={`/capital/transfer/${contract.id}`}>
        <FormattedMessage
          id={getStateActionLinkText(contract, myRole)}
          values={{
            buyerName: getFullName(contract.buyer),
            sellerName: getFullName(contract.seller),
          }}
        />
      </Link>
    </li>
  );
};

const getStateDescription = (
  contract: CapitalTransferContract,
  myRole: 'BUYER' | 'SELLER',
): TranslationKey | null => {
  const key = `capital.transfer.list.stateDescription.${myRole}.${contract.state}`;
  if (isTranslationKey(key)) {
    return key;
  }

  return null;
};

const getStateActionLinkText = (
  contract: CapitalTransferContract,
  myRole: 'BUYER' | 'SELLER',
): TranslationKey => {
  const key = `capital.transfer.list.action.${myRole}.${contract.state}`;
  if (isTranslationKey(key)) {
    return key;
  }

  return 'capital.transfer.list.action.default';
};

const getStateSortOrder = (myRole: 'BUYER' | 'SELLER') => {
  const pendingBuyerActionStatuses = ['BUYER_SIGNED', 'SELLER_SIGNED'];

  const pendingSellerActionStatuses = ['CREATED', 'PAYMENT_CONFIRMED_BY_BUYER'];

  if (myRole === 'BUYER') {
    return pendingBuyerActionStatuses;
  }

  return pendingSellerActionStatuses;
};
