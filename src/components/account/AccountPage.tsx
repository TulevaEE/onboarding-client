import { useMe } from '../common/apiHooks';
import { isActingAsSelf } from '../common/utils';
import { RepresentedPartyAccountPage } from './RepresentedPartyAccountPage';
import ConnectedPersonAccountPage from './PersonAccountPage';

export default function AccountPage() {
  const { data: user } = useMe();

  if (!user) {
    return null;
  }

  return isActingAsSelf(user) ? <ConnectedPersonAccountPage /> : <RepresentedPartyAccountPage />;
}
