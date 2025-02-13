import React from 'react';

import { FormattedMessage } from 'react-intl';
import { logo } from '../../common';
import LanguageSwitcher from './languageSwitcher';
import { Shimmer } from '../../common/shimmer/Shimmer';

type Props = {
  // TODO move to useMe hook here
  user: { name: string };
  loading: boolean;
  onLogout: () => unknown;
};

export const Header = ({ user, loading, onLogout }: Props) => (
  <>
    <div className="d-flex justify-content-between align-items-center border-bottom py-4 mb-5 app-header">
      <a href="/account">
        <img src={logo} alt="Tuleva" className="brand-logo" />
      </a>
      <div>
        {loading || !user ? (
          <div className="d-flex flex-column gap-2 align-items-end">
            <div style={{ width: '160px' }}>
              <Shimmer height={24} />
            </div>
            <div style={{ width: '120px' }}>
              <Shimmer height={24} />
            </div>
          </div>
        ) : (
          <>
            <p className="m-0 d-flex justify-content-end align-items-baseline">
              <span className="text-body">{user.name}</span>
              <span className="text-separator mx-2">&middot;</span>
              <button type="button" className="btn btn-link p-0 border-0" onClick={onLogout}>
                <FormattedMessage id="log.out" />
              </button>
            </p>
            <p className="m-0 mt-2 d-flex justify-content-end align-items-baseline">
              <a className="btn btn-link p-0 border-0" href="/account">
                <FormattedMessage id="header.my.account" />
              </a>
              <span className="text-separator mx-2">&middot;</span>
              <LanguageSwitcher />
            </p>
          </>
        )}
      </div>
    </div>
  </>
);
