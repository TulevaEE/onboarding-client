import React from 'react';
import { FormattedMessage } from 'react-intl';

import { isSessionStorageBlocked } from '../../common/siteStorage';
import { inBrave } from '../../common/browserFamily';

export const AllowCookiesToLogIn: React.FC = () =>
  isSessionStorageBlocked() ? (
    <p className="alert alert-warning text-balance mt-4 mb-0">
      <FormattedMessage id={inBrave() ? 'login.allow.cookies.brave' : 'login.allow.cookies'} />
    </p>
  ) : null;
