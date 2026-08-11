import { useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { captureException } from '@sentry/browser';
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

// A link in an email cannot name the account it opens: a child's code is an
// isikukood and must stay out of URLs, browser history and logs. So the path says
// only *which kind* of account to open, the role is resolved here from the roles
// the member actually holds, and the URL is replaced with the plain account path.
export const RoleDeepLink = ({ holder, onRoleSwitched }: Props) => {
  const history = useHistory();
  const { data: user, isError: userFailed } = useMe();
  const { data: roles, isError: rolesFailed } = useRoles();
  const switchRole = useSwitchRole();
  const resolved = useRef(false);

  useEffect(() => {
    // A failed lookup still has to land somewhere. Without counting the error as
    // finished, a member arriving from an email would sit on the shimmer forever.
    const lookupFinished = (user || userFailed) && (roles || rolesFailed);
    if (resolved.current || !lookupFinished) {
      return;
    }
    resolved.current = true;

    const openAccount = async () => {
      // Already representing this kind of account: switching would drag someone
      // looking at their second child back to their first.
      const target =
        user && roles && accountHolderFor(user) !== holder
          ? roles.find((role) => accountHolderForRole(role, user.personalCode) === holder)
          : undefined;

      if (target) {
        try {
          await switchRole.mutateAsync({ type: target.type, code: target.code });
          await onRoleSwitched();
        } catch (error) {
          // The backend fails closed on a role the member may not represent. Their
          // own account beats an error page reached from a marketing email, but a
          // link that quietly stops working is worth knowing about.
          captureException(error);
        }
      }

      history.replace('/account');
    };

    openAccount();
  }, [user, userFailed, roles, rolesFailed, holder, history, onRoleSwitched, switchRole]);

  return <AccountPageLoader />;
};
