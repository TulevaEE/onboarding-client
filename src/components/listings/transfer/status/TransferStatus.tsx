import { useParams } from 'react-router-dom';
import { useMe } from '../../../common/apiHooks';
import { Loader } from '../../../common';
import { ContractDetails } from '../components/ContractDetails';

export const TransferStatus = () => {
  const params = useParams<{ id: string }>();

  const { data: me } = useMe();

  if (!me) {
    return <Loader className="align-middle" />;
  }

  return (
    <div className="col-12 col-md-11 col-lg-9 mx-auto">
      <div className="bg-gray-1 border rounded br-3 p-4">
        <h1>Lepingu andmed</h1>

        <div className="pt-5">
          <ContractDetails
            seller={me}
            buyer={{
              personalCode: '38406250123',
              firstName: 'Kaarel',
              lastName: 'Karikakar',
            }}
            pricePerUnit={2}
            unitCount={2000}
            sellerIban="EE_TEST_IBAN"
            progress={{
              signed: { seller: true, buyer: true },
              confirmed: { seller: false, buyer: false },
            }}
          />
        </div>
      </div>
    </div>
  );
};
