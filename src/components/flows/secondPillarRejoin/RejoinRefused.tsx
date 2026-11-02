import { PropsWithChildren } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

export const RejoinRefused = ({ children }: PropsWithChildren<unknown>) => (
  <>
    <h1 className="mb-4 text-balance">
      <FormattedMessage id="pageTitle.secondPillarRejoin" />
    </h1>
    <p className="mb-4 text-pretty">{children}</p>
    <Link to="/account" className="btn btn-outline-primary">
      <FormattedMessage id="secondPillarRejoin.notPermitted.backToAccountPage" />
    </Link>
  </>
);
