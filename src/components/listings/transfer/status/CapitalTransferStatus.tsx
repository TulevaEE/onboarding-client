import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { info } from 'sass';
import { useMe } from '../../../common/apiHooks';
import { Loader } from '../../../common';
import { ContractDetails } from '../components/ContractDetails';
import { MemberCapitalTransferContractState } from '../../../common/apiModels';

export const CapitalTransferStatus = () => {
  const params = useParams<{ id: string }>();

  const { data: me } = useMe();

  const [state, setState] = useState<MemberCapitalTransferContractState>('CREATED');

  if (!me) {
    return <Loader className="align-middle" />;
  }

  const mockContract = {
    seller: me,
    buyer: {
      personalCode: '38406250123',
      firstName: 'Kaarel',
      lastName: 'Karikakar',
    },
    pricePerUnit: 2,
    unitCount: 2000,
    sellerIban: 'EE_TEST_IBAN',
  };

  // TODO
  const myRole = mockContract.seller.personalCode === me.personalCode ? 'SELLER' : 'BUYER';

  return (
    <div className="col-12 col-md-11 col-lg-9 mx-auto">
      <select
        name="test-state"
        id="test-state"
        onChange={(e) => setState(e.target.value as MemberCapitalTransferContractState)}
      >
        <label htmlFor="test-state">Test state</label>
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
      <div className="bg-gray-1 border rounded br-3 p-4">
        {state === 'APPROVED' && (
          <div className="alert alert-info">
            Avaldus on saadetud Tuleva ühistu juhatusele. Vaatame avalduse 1 nädala jooksul üle ja
            teavitame osapooli otsusest e-postiga.
          </div>
        )}
        {state === 'CANCELLED' && (
          <div className="alert alert-warning">TODO Avaldus on tühistatud</div>
        )}
        <h1>Lepingu andmed</h1>

        <div className="pt-4">
          <ContractDetails
            seller={mockContract.seller}
            buyer={mockContract.buyer}
            userRole={myRole}
            pricePerUnit={mockContract.pricePerUnit}
            unitCount={mockContract.unitCount}
            sellerIban={mockContract.sellerIban}
            {...{ progress: getProgressFromStatus(state) ?? undefined }}
          />
        </div>
      </div>
    </div>
  );
};

const getProgressFromStatus = (
  status: MemberCapitalTransferContractState,
): {
  signed: { seller: boolean; buyer: boolean };
  confirmed: { seller: boolean; buyer: boolean };
} | null => {
  const baseState = {
    signed: { seller: false, buyer: false },
    confirmed: { seller: false, buyer: false },
  };

  switch (status) {
    case 'CREATED':
      return baseState;
    case 'SELLER_SIGNED':
      return { ...baseState, signed: { ...baseState.signed, seller: true } };
    case 'BUYER_SIGNED':
      return { ...baseState, signed: { buyer: true, seller: true } };
    case 'PAYMENT_CONFIRMED_BY_BUYER':
      return {
        confirmed: { ...baseState.confirmed, buyer: true },
        signed: { buyer: true, seller: true },
      };

    case 'PAYMENT_CONFIRMED_BY_SELLER':
    case 'APPROVED':
      return {
        confirmed: { buyer: true, seller: true },
        signed: { buyer: true, seller: true },
      };

    default:
      return null;
  }
};
