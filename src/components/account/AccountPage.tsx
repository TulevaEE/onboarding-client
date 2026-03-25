import { useMe } from '../common/apiHooks';
import { LegalEntityAccountPage } from './LegalEntityAccountPage';
import ConnectedPersonAccountPage from './PersonAccountPage';

export default function AccountPage() {
  const { data: user } = useMe();

  switch (user?.role.type) {
    case 'LEGAL_ENTITY':
      return <LegalEntityAccountPage />;
    case 'PERSON':
      return <ConnectedPersonAccountPage />;
    default:
      return null;
  }
}
