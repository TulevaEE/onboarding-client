import { useEffect, useRef } from 'react';
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
  const resolved = useRef(false);
  const leftPage = useRef(false);

  useEffect(
    () => () => {
      leftPage.current = true;
    },
    [],
  );

  useEffect(() => {
    const lookupSettled = (user || userFailed) && (roles || rolesFailed);
    if (resolved.current || !lookupSettled) {
      return;
    }
    resolved.current = true;

    const openAccount = async () => {
      const target = user && roles ? roleToSwitchTo(user, roles, holder) : undefined;

      if (target) {
        try {
          await switchRole.mutateAsync({ type: target.type, code: target.code });
          await onRoleSwitched();
        } catch (error) {
          captureException(error);
        }
      }

      if (!leftPage.current) {
        history.replace('/account');
      }
    };

    openAccount();
  }, [user, userFailed, roles, rolesFailed, holder, history, onRoleSwitched, switchRole]);

  return <AccountPageLoader />;
};
