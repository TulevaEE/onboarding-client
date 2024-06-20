import React from 'react';

import { FormattedMessage } from 'react-intl';
import { Loader, logo } from '../../common';
import LanguageSwitcher from './languageSwitcher';

type Props = {
  // TODO move to useMe hook here
  user: { name: string };
  loading: boolean;
  onLogout: () => unknown;
};

export const Header = ({ user, loading, onLogout }: Props) => {
  return (
    <>
      <div className="d-flex justify-content-between align-items-end border-bottom pb-4 mb-5 app-header">
        <a href="/account">
          <img src={logo} alt="Tuleva" className="brand-logo" />
        </a>
        <div className="text-right">
          {loading || !user ? (
            <Loader className="align-right" />
          ) : (
            <>
              <p className="m-0">
                <span className="text-body align-middle">{user.name}</span>
                <span className="text-secondary align-middle">&ensp;&middot;&ensp;</span>
                <button type="button" className="btn btn-link p-0 border-0" onClick={onLogout}>
                  <FormattedMessage id="log.out" />
                </button>
              </p>
              <p className="m-0 mt-1">
                <a className="btn btn-link p-0 border-0" href="/account">
                  <FormattedMessage id="header.my.account" />
                </a>
                <span className="text-secondary align-middle">&ensp;&middot;&ensp;</span>
                <LanguageSwitcher />
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
};
