import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { PendingOnboarding } from '../../../common/apiModels';
import {
  CHILD_ONBOARDING_ROUTE,
  childOnboardingLocation,
} from '../SavingsFundOnboarding/onboardingFlows';
import { PII_CLASS } from '../../../tracking/piiMarkup';

type Props = {
  pendingOnboardings: PendingOnboarding[];
};

export const NoChildAccount: FC<Props> = ({ pendingOnboardings }) => (
  <div className="d-flex flex-column align-items-start gap-4">
    <h1 className="m-0 w-100 text-center">
      <FormattedMessage id="giftLink.parent.title" />
    </h1>
    <p className="m-0">
      <FormattedMessage id="giftLink.parent.noChild" />
    </p>
    {pendingOnboardings.map(({ code, name }) => (
      <Link key={code} className={PII_CLASS} to={childOnboardingLocation(code)}>
        <FormattedMessage id="giftLink.parent.pendingOnboarding" values={{ name }} />
      </Link>
    ))}
    <div className="w-100 d-flex flex-column-reverse flex-sm-row justify-content-between gap-3 pt-2">
      <Link to="/account" className="btn btn-outline-primary">
        <FormattedMessage id="giftLink.parent.back" />
      </Link>
      <Link to={CHILD_ONBOARDING_ROUTE} className="btn btn-primary">
        <FormattedMessage id="giftLink.parent.openChildAccount" />
      </Link>
    </div>
  </div>
);
