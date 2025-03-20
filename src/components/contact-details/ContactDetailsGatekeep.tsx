import moment from 'moment';
import { Redirect, useLocation } from 'react-router-dom';
import { PropsWithChildren } from 'react';
import { LocationDescriptor } from 'history';
import { useSelector } from 'react-redux';
import { User } from '../common/apiModels';
import { State } from '../../types';

export type ContactDetailsRedirectState = {
  from: string;
  mandatoryUpdate: true;
};

export const ContactDetailsGatekeep = ({ children }: PropsWithChildren<unknown>) => {
  const user = useSelector((state: State) => state.login.user); // used instead of useMe to prevent potential cache invalidation issues
  // to use useMe here, need to migrate entire use change logic to react-query mutation

  const location = useLocation();

  if (!user) {
    return null;
  }

  if (!areContactDetailsUpToDate(user) && hasPensionAccount(user)) {
    const redirectLocation: LocationDescriptor<ContactDetailsRedirectState> = {
      pathname: '/contact-details',
      state: { from: location.pathname, mandatoryUpdate: true },
    };

    return <Redirect to={redirectLocation} />;
  }

  return <>{children}</>;
};

export const areContactDetailsUpToDate = (user: User) => {
  const lastUpdateDate = user.contactDetailsLastUpdateDate;
  if (!user.contactDetailsLastUpdateDate) {
    return false;
  }

  const aYearAgo = moment().subtract(1, 'year');

  return moment(lastUpdateDate).isAfter(aYearAgo);
};

const hasPensionAccount = (user: User) => user.secondPillarActive || user.thirdPillarActive;
