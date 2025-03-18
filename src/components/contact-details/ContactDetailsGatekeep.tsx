import moment from 'moment';
import { Redirect, useLocation } from 'react-router-dom';
import { PropsWithChildren } from 'react';
import { LocationDescriptor } from 'history';
import { useMe } from '../common/apiHooks';
import { User } from '../common/apiModels';

export type ContactDetailsRedirectState = { from: string; mandatoryUpdate: true };

// TODO II III pillar specific only email + phone
export const ContactDetailsGatekeep = ({ children }: PropsWithChildren<unknown>) => {
  const { data: user } = useMe();

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

const areContactDetailsUpToDate = (user: User) => {
  const lastUpdateDate = user.contactDetailsLastUpdateDate;
  if (!user.contactDetailsLastUpdateDate) {
    return false;
  }

  const aYearAgo = moment().subtract(1, 'year');

  return moment(lastUpdateDate).isAfter(aYearAgo);
};

const hasPensionAccount = (user: User) => user.secondPillarActive || user.thirdPillarActive;
