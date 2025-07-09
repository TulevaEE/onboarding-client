import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { useMe } from '../../../common/apiHooks';
import { Loader } from '../../../common';
import { ContractDetails } from '../components/ContractDetails';
import {
  MemberCapitalTransferContract,
  MemberCapitalTransferContractState,
} from '../../../common/apiModels';
import { getContractDetailsPropsFromContract, getMyRole } from './utils';
import { BuyerFlow } from './buyer/BuyerFlow';
import { SellerConfirm } from './seller/SellerConfirm';

export const CapitalTransferStatus = () => {
  const params = useParams<{ id: string }>();

  const { data: me } = useMe();

  const [debugState, setDebugState] = useState<MemberCapitalTransferContractState>('CREATED');
  const [myDebugRole, setMyDebugRole] = useState<'BUYER' | 'SELLER'>('SELLER');

  if (!me) {
    return <Loader className="align-middle" />;
  }

  const mockContract: MemberCapitalTransferContract = {
    seller:
      myDebugRole === 'SELLER'
        ? me
        : {
            personalCode: '38406250123',
            firstName: 'Kaarel',
            lastName: 'Karikakar',
          },
    buyer:
      myDebugRole === 'BUYER'
        ? me
        : {
            personalCode: '38406250123',
            firstName: 'Kaarel',
            lastName: 'Karikakar',
          },
    pricePerUnit: 2,
    unitCount: 2000,
    sellerIban: 'EE_TEST_IBAN',
  };

  const myRole = getMyRole(me, mockContract);

  const showBuyerFlow =
    (debugState === 'SELLER_SIGNED' || debugState === 'BUYER_SIGNED') && myRole === 'BUYER';

  const showSellerConfirmation = debugState === 'PAYMENT_CONFIRMED_BY_BUYER' && myRole === 'SELLER';

  return (
    <div className="col-12 col-md-11 col-lg-9 mx-auto">
      <div>
        <label htmlFor="test-state" className="form-label">
          Test state
        </label>
        <select
          name="test-state"
          id="test-state"
          value={debugState}
          onChange={(e) => setDebugState(e.target.value as MemberCapitalTransferContractState)}
        >
          {[
            'CREATED',
            'SELLER_SIGNED',
            'BUYER_SIGNED',
            'PAYMENT_CONFIRMED_BY_BUYER',
            'PAYMENT_CONFIRMED_BY_SELLER',
            'APPROVED',
            'CANCELLED',
          ].map((stateOption) => (
            <option key={stateOption} value={stateOption}>
              {stateOption}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="test-role" className="form-label">
          Test role
        </label>
        <select
          name="test-role"
          id="test-role"
          value={myDebugRole}
          onChange={(e) => setMyDebugRole(e.target.value as 'BUYER' | 'SELLER')}
        >
          <option value="SELLER">SELLER</option>
          <option value="BUYER">BUYER</option>
        </select>
      </div>
      <div className="bg-gray-1 border rounded br-3 p-4">
        {showBuyerFlow && (
          <BuyerFlow
            contract={mockContract}
            state={debugState}
            setDebugState={(state) => setDebugState(state)}
          />
        )}
        {showSellerConfirmation && (
          <SellerConfirm
            contract={mockContract}
            state={debugState}
            onConfirmed={() => setDebugState('PAYMENT_CONFIRMED_BY_SELLER')}
          />
        )}
        {!showBuyerFlow && !showSellerConfirmation && (
          <StatusDisplay state={debugState} contract={mockContract} />
        )}
      </div>
    </div>
  );
};

const StatusDisplay = ({
  state,
  contract,
}: {
  state: MemberCapitalTransferContractState;
  contract: MemberCapitalTransferContract;
}) => {
  const { data: me } = useMe();

  if (!me) {
    return <Loader className="align-middle" />;
  }

  return (
    <>
      {state === 'CANCELLED' && (
        <div className="alert alert-warning">TODO Avaldus on tühistatud</div>
      )}
      {state === 'PAYMENT_CONFIRMED_BY_SELLER' && (
        <div className="alert alert-info d-flex">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            className="flex-shrink-0 mt-1 me-3"
            fill="none"
          >
            <g clipPath="url(#clip0_3932_4974)">
              <path
                d="M8 15C6.14348 15 4.36301 14.2625 3.05025 12.9497C1.7375 11.637 1 9.85652 1 8C1 6.14348 1.7375 4.36301 3.05025 3.05025C4.36301 1.7375 6.14348 1 8 1C9.85652 1 11.637 1.7375 12.9497 3.05025C14.2625 4.36301 15 6.14348 15 8C15 9.85652 14.2625 11.637 12.9497 12.9497C11.637 14.2625 9.85652 15 8 15ZM8 16C10.1217 16 12.1566 15.1571 13.6569 13.6569C15.1571 12.1566 16 10.1217 16 8C16 5.87827 15.1571 3.84344 13.6569 2.34315C12.1566 0.842855 10.1217 0 8 0C5.87827 0 3.84344 0.842855 2.34315 2.34315C0.842855 3.84344 0 5.87827 0 8C0 10.1217 0.842855 12.1566 2.34315 13.6569C3.84344 15.1571 5.87827 16 8 16Z"
                fill="#002F63"
              />
              <path
                d="M8.92995 6.588L6.63995 6.875L6.55795 7.255L7.00795 7.338C7.30195 7.408 7.35995 7.514 7.29595 7.807L6.55795 11.275C6.36395 12.172 6.66295 12.594 7.36595 12.594C7.91095 12.594 8.54395 12.342 8.83095 11.996L8.91895 11.58C8.71895 11.756 8.42695 11.826 8.23295 11.826C7.95795 11.826 7.85795 11.633 7.92895 11.293L8.92995 6.588ZM8.99995 4.5C8.99995 4.76522 8.8946 5.01957 8.70706 5.20711C8.51952 5.39464 8.26517 5.5 7.99995 5.5C7.73474 5.5 7.48038 5.39464 7.29285 5.20711C7.10531 5.01957 6.99995 4.76522 6.99995 4.5C6.99995 4.23478 7.10531 3.98043 7.29285 3.79289C7.48038 3.60536 7.73474 3.5 7.99995 3.5C8.26517 3.5 8.51952 3.60536 8.70706 3.79289C8.8946 3.98043 8.99995 4.23478 8.99995 4.5Z"
                fill="#002F63"
              />
            </g>
            <defs>
              <clipPath id="clip0_3932_4974">
                <rect width="16" height="16" fill="white" />
              </clipPath>
            </defs>
          </svg>
          Avaldus on saadetud Tuleva ühistu juhatusele. Vaatame avalduse 1 nädala jooksul üle ja
          teavitame osapooli otsusest e-postiga.
        </div>
      )}

      {state === 'APPROVED' && (
        <div className="alert alert-success">
          TODO Avaldus on kinnitatud Tuleva ühistu juhatuse poolt.
        </div>
      )}

      <h1>Lepingu andmed</h1>
      <div className="pt-4">
        <ContractDetails
          {...getContractDetailsPropsFromContract(contract, state)}
          userRole={getMyRole(me, contract)}
        />
      </div>
    </>
  );
};
