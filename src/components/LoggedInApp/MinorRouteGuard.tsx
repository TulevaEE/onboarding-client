import { matchPath, Redirect, useLocation } from 'react-router-dom';
import { useMe } from '../common/apiHooks';
import { isMinorActingAsSelf } from '../common/utils';
import { ACCOUNT_PATH } from '../paths';

export const PATHS_A_MINOR_CAN_OPEN = [
  ACCOUNT_PATH,
  '/savings-fund-transactions',
  '/3rd-pillar-transactions',
  '/transaction/:id',
];

export const MinorRouteGuard = () => {
  const { data: user } = useMe();
  const { pathname } = useLocation();

  if (
    isMinorActingAsSelf(user) &&
    !matchPath(pathname, { path: PATHS_A_MINOR_CAN_OPEN, exact: true })
  ) {
    return <Redirect to={ACCOUNT_PATH} />;
  }

  return null;
};
