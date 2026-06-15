import { useMe } from '../common/apiHooks';
import { isActingAsSelf } from '../common/utils';
import { RepresentedPartyAccountPage } from './RepresentedPartyAccountPage';
import ConnectedPersonAccountPage from './PersonAccountPage';
import { AccountPageLoader } from './AccountPageLoader';

export default function AccountPage() {
  const { data: user, isLoading } = useMe();

  // A role switch resets the cache, so `user` is briefly empty while the new role
  // loads — show a shimmer rather than the previous role's account page. Only
  // while actually loading: on a failed user query keep the old blank instead of
  // a shimmer that never resolves.
  if (!user) {
    return isLoading ? <AccountPageLoader /> : null;
  }

  return isActingAsSelf(user) ? <ConnectedPersonAccountPage /> : <RepresentedPartyAccountPage />;
}
