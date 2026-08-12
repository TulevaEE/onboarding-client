import { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
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
  onRoleSwitched: () => Promise<void>;
};

const lowestByCode = (roles: Role[]): Role | undefined =>
  [...roles].sort((a, b) => a.code.localeCompare(b.code))[0];

const roleToSwitchTo = (user: User, roles: Role[], holder: AccountHolder): Role | undefined => {
  if (accountHolderFor(user) === holder) {
    return undefined;
  }
  return lowestByCode(
    roles.filter((role) => accountHolderForRole(role, user.personalCode) === holder),
  );
};

// The path names only the kind of account, never the account: a child's code is an
// isikukood and must stay out of the URL, browser history and logs.
export const RoleDeepLink = ({ holder, onRoleSwitched }: Props) => {
  const history = useHistory();
  const { data: user, isError: userFailed } = useMe();
  const { data: roles, isError: rolesFailed } = useRoles();
  const switchRole = useSwitchRole();
  const [switching, setSwitching] = useState(false);
  const openedHolder = useRef<AccountHolder | null>(null);
  const requestedHolder = useRef(holder);
  const leftPage = useRef(false);

  useEffect(() => {
    requestedHolder.current = holder;
  }, [holder]);

  useEffect(
    () => () => {
      leftPage.current = true;
    },
    [],
  );

  useEffect(() => {
    const lookupSettled = (user || userFailed) && (roles || rolesFailed);
    if (switching || openedHolder.current === holder || !lookupSettled) {
      return;
    }
    openedHolder.current = holder;

    const openAccount = async () => {
      const target = user && roles ? roleToSwitchTo(user, roles, holder) : undefined;

      if (target) {
        setSwitching(true);
        try {
          await switchRole.mutateAsync({ type: target.type, code: target.code });
          await onRoleSwitched();
        } catch (error) {
          captureException(error);
        } finally {
          if (!leftPage.current) {
            setSwitching(false);
          }
        }
      }

      if (requestedHolder.current === holder && !leftPage.current) {
        history.replace('/account');
      }
    };

    openAccount();
  }, [
    user,
    userFailed,
    roles,
    rolesFailed,
    holder,
    switching,
    history,
    onRoleSwitched,
    switchRole,
  ]);

  return <AccountPageLoader />;
};
