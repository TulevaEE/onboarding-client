import moment from 'moment';
import { Redirect, RouteComponentProps, useLocation } from 'react-router-dom';
import { PropsWithChildren } from 'react';
import { useMe } from '../common/apiHooks';
import { User } from '../common/apiModels';

export const ContactDetailsGatekeep = ({ children }: PropsWithChildren<unknown>) => {
  const { data: user } = useMe();

  const location = useLocation();

  if (!user) {
    return null;
  }

  if (!areContactDetailsUpToDate(user) && hasPensionAccount(user)) {
    return <Redirect to="/contact-details" />;
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
