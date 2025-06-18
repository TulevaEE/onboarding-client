import { useSelector } from 'react-redux';
import { Redirect, useLocation } from 'react-router-dom';
import { PropsWithChildren } from 'react';
import { State } from '../../types';

export const MembersOnlyGatekeep = ({ children }: PropsWithChildren<unknown>) => {
  const user = useSelector((state: State) => state.login.user); // used instead of useMe to prevent potential cache invalidation issues
  // to use useMe here, need to migrate entire use change logic to react-query mutation

  const location = useLocation();

  if (!user) {
    return null;
  }

  if (!user.memberNumber) {
    return <Redirect to="/" />;
  }

  return <>{children}</>;
};
