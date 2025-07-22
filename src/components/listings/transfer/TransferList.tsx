import { Link } from 'react-router-dom';
import { Loader } from '../../common';
import { useMe, useMyCapitalTransferContracts } from '../../common/apiHooks';
import { User } from '../../common/apiModels';
import { CapitalTransferContract } from '../../common/apiModels/capital-transfer';
import { getFullName } from '../../common/utils';
import { getMyRole } from './status/utils';

export const TransferList = () => {
  const { data: contracts, isLoading: isLoadingContracts } = useMyCapitalTransferContracts();
  const { data: me, isLoading: isLoadingUser } = useMe();

  console.log(isLoadingContracts, isLoadingUser, me);
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

  const title =
    filteredContracts.length > 1
      ? `Sul on ${filteredContracts.length} pooleliolevat avaldust`
      : 'Sul on pooleliolev avaldus';

  return (
    <div className="card p-4">
      <b className="pb-2">{title}</b>
      {sortedContracts.map((contract) => (
        <TransferItem contract={contract} me={me} key={contract.id} />
      ))}
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
    <div
      className="d-flex justify-content-between my-1"
      data-testid="active-capital-transfer-contract"
    >
      <div className="d-flex align-items-center">
        {isPendingOnMyAction ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="me-2"
          >
            <g clipPath="url(#clip0_3931_4487)">
              <path
                d="M16 8C16 10.1217 15.1571 12.1566 13.6569 13.6569C12.1566 15.1571 10.1217 16 8 16C5.87827 16 3.84344 15.1571 2.34315 13.6569C0.842855 12.1566 0 10.1217 0 8C0 5.87827 0.842855 3.84344 2.34315 2.34315C3.84344 0.842855 5.87827 0 8 0C10.1217 0 12.1566 0.842855 13.6569 2.34315C15.1571 3.84344 16 5.87827 16 8ZM8 3.5C8 3.36739 7.94732 3.24021 7.85355 3.14645C7.75979 3.05268 7.63261 3 7.5 3C7.36739 3 7.24021 3.05268 7.14645 3.14645C7.05268 3.24021 7 3.36739 7 3.5V9C7.00003 9.08813 7.02335 9.17469 7.06761 9.25091C7.11186 9.32712 7.17547 9.39029 7.252 9.434L10.752 11.434C10.8669 11.4961 11.0014 11.5108 11.127 11.4749C11.2525 11.4391 11.3591 11.3556 11.4238 11.2422C11.4886 11.1288 11.5065 10.9946 11.4736 10.8683C11.4408 10.7419 11.3598 10.6334 11.248 10.566L8 8.71V3.5Z"
                fill="#6B7074"
              />
            </g>
            <defs>
              <clipPath id="clip0_3931_4487">
                <rect width="16" height="16" fill="white" />
              </clipPath>
            </defs>
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="me-2"
          >
            <g clipPath="url(#clip0_3931_4499)">
              <path
                d="M8 3.5C8 3.36739 7.94732 3.24021 7.85355 3.14645C7.75979 3.05268 7.63261 3 7.5 3C7.36739 3 7.24021 3.05268 7.14645 3.14645C7.05268 3.24021 7 3.36739 7 3.5V9C7.00003 9.08813 7.02335 9.17469 7.06761 9.25091C7.11186 9.32712 7.17547 9.39029 7.252 9.434L10.752 11.434C10.8669 11.4961 11.0014 11.5108 11.127 11.4749C11.2525 11.4391 11.3591 11.3556 11.4238 11.2422C11.4886 11.1288 11.5065 10.9946 11.4736 10.8683C11.4408 10.7419 11.3598 10.6334 11.248 10.566L8 8.71V3.5Z"
                fill="#6B7074"
              />
              <path
                d="M8 16C10.1217 16 12.1566 15.1571 13.6569 13.6569C15.1571 12.1566 16 10.1217 16 8C16 5.87827 15.1571 3.84344 13.6569 2.34315C12.1566 0.842855 10.1217 0 8 0C5.87827 0 3.84344 0.842855 2.34315 2.34315C0.842855 3.84344 0 5.87827 0 8C0 10.1217 0.842855 12.1566 2.34315 13.6569C3.84344 15.1571 5.87827 16 8 16ZM15 8C15 9.85652 14.2625 11.637 12.9497 12.9497C11.637 14.2625 9.85652 15 8 15C6.14348 15 4.36301 14.2625 3.05025 12.9497C1.7375 11.637 1 9.85652 1 8C1 6.14348 1.7375 4.36301 3.05025 3.05025C4.36301 1.7375 6.14348 1 8 1C9.85652 1 11.637 1.7375 12.9497 3.05025C14.2625 4.36301 15 6.14348 15 8Z"
                fill="#6B7074"
              />
            </g>
            <defs>
              <clipPath id="clip0_3931_4499">
                <rect width="16" height="16" fill="white" />
              </clipPath>
            </defs>
          </svg>
        )}
        <div>{stateDescription}</div>
      </div>
      <Link to={`/capital/transfer/${contract.id}`}>
        {getStateActionLinkText(contract, myRole)}
      </Link>
    </div>
  );
};

const getStateDescription = (contract: CapitalTransferContract, myRole: 'BUYER' | 'SELLER') => {
  if (myRole === 'BUYER') {
    switch (contract.state) {
      case 'SELLER_SIGNED':
        return 'Sinu allkirja ootel';
      case 'BUYER_SIGNED':
        return 'Sinu makse tegemise ootel';
      case 'PAYMENT_CONFIRMED_BY_BUYER':
        return `Müüja maksekinnituse ootel: ${getFullName(contract.seller)}`;
      case 'CREATED':
        return `Müüja allkirja ootel: ${getFullName(contract.seller)}`;
      case 'PAYMENT_CONFIRMED_BY_SELLER':
        return 'Tuleva ühistu juhatuse otsuse ootel';
      default:
        return null;
    }
  }

  switch (contract.state) {
    case 'SELLER_SIGNED':
      return `Ostja allkirja ootel: ${getFullName(contract.buyer)}`;
    case 'BUYER_SIGNED':
      return `Ostja maksekinnituse ootel: ${getFullName(contract.buyer)}`;
    case 'PAYMENT_CONFIRMED_BY_BUYER':
      return 'Sinu kinnituse ootel raha laekumise kohta';
    case 'CREATED':
      return 'Sinu allkirja ootel';
    case 'PAYMENT_CONFIRMED_BY_SELLER':
      return 'Tuleva ühistu juhatuse otsuse ootel';
    default:
      return null;
  }
};

const getStateActionLinkText = (contract: CapitalTransferContract, myRole: 'BUYER' | 'SELLER') => {
  if (myRole === 'BUYER') {
    switch (contract.state) {
      case 'SELLER_SIGNED':
        return 'Allkirjastama';
      case 'BUYER_SIGNED':
        return 'Makset tegema';
      default:
        return 'Vaatan';
    }
  }

  switch (contract.state) {
    case 'PAYMENT_CONFIRMED_BY_BUYER':
      return 'Kinnitama';
    case 'CREATED':
      return 'Allkirjastama';
    default:
      return 'Vaatan';
  }
};

const getStateSortOrder = (myRole: 'BUYER' | 'SELLER') => {
  const pendingBuyerActionStatuses = ['BUYER_SIGNED', 'SELLER_SIGNED'];

  const pendingSellerActionStatuses = ['CREATED', 'PAYMENT_CONFIRMED_BY_BUYER'];

  if (myRole === 'BUYER') {
    return pendingBuyerActionStatuses;
  }

  return pendingSellerActionStatuses;
};
