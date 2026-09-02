import { useEffect, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { captureException } from '@sentry/browser';
import { Role, User } from '../common/apiModels';
import { useMe, useRoles, useSwitchRole } from '../common/apiHooks';
import {
  AccountHolder,
  accountHolderFor,
  accountHolderForRole,
} from '../flows/savingsAccount/accountHolder';
import { AccountPageLoader } from './AccountPageLoader';

type Props = {
  holder: Exclude<AccountHolder, 'self'>;
  destination: string;
  accountId?: string;
  onRoleSwitched: () => Promise<void>;
};

const lowestByCode = (roles: Role[]): Role | undefined =>
  [...roles].sort((a, b) => a.code.localeCompare(b.code))[0];

// The id names the very account the link was sent about; without it, or once it no longer
// exists, any account of that kind is a better landing place than none.
const roleFor = (
  user: User,
  roles: Role[],
  holder: AccountHolder,
  accountId: string | undefined,
): Role | undefined => {
  const ofHolder = roles.filter((role) => accountHolderForRole(role, user.personalCode) === holder);
  const named = accountId ? ofHolder.find((role) => role.id === accountId) : undefined;
  return named ?? lowestByCode(ofHolder);
};

// The path names only the kind of account, never the account: a child's code is an
// isikukood and must stay out of the URL, browser history and logs.
export const RoleDeepLink = ({ holder, destination, accountId, onRoleSwitched }: Props) => {
  const history = useHistory();
  const { search } = useLocation();
  const { data: user, isError: userFailed } = useMe();
  const { data: roles, isError: rolesFailed } = useRoles();
  const switchRole = useSwitchRole();
  const [switching, setSwitching] = useState(false);
  const request = `${holder} ${destination} ${accountId ?? ''} ${search}`;
  const openedRequest = useRef<string | null>(null);
  const requestedRequest = useRef(request);
  const leftPage = useRef(false);

  useEffect(() => {
    requestedRequest.current = request;
  }, [request]);

  useEffect(
    () => () => {
      leftPage.current = true;
    },
    [],
  );

  useEffect(() => {
    const lookupSettled = (user || userFailed) && (roles || rolesFailed);
    if (switching || openedRequest.current === request || !lookupSettled) {
      return;
    }
    openedRequest.current = request;

    const openAccount = async () => {
      let opened = !!user && accountHolderFor(user) === holder;
      const target = !opened && user && roles ? roleFor(user, roles, holder, accountId) : undefined;

      if (target) {
        setSwitching(true);
        try {
          await switchRole.mutateAsync({ type: target.type, code: target.code });
          await onRoleSwitched();
          opened = true;
        } catch (error) {
          captureException(error);
        } finally {
          if (!leftPage.current) {
            setSwitching(false);
          }
        }
      }

      if (requestedRequest.current === request && !leftPage.current) {
        history.replace({ pathname: opened ? destination : '/account', search });
      }
    };

    openAccount();
  }, [
    user,
    userFailed,
    roles,
    rolesFailed,
    holder,
    destination,
    accountId,
    request,
    search,
    switching,
    history,
    onRoleSwitched,
    switchRole,
  ]);

  return <AccountPageLoader />;
};
