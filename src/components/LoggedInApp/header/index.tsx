import React from 'react';

import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
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
    <a className="skip-link visually-hidden-focusable" href="#main">
      <FormattedMessage id="global.skipToContent" />
    </a>
    <header className="d-flex justify-content-between align-items-center border-bottom py-4 mb-5 app-header">
      <Link to="/account">
        <img src={logo} alt="Tuleva" className="brand-logo" />
      </Link>
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
            <p className="m-0 d-flex gap-3 justify-content-end align-items-baseline">
              <span className="text-body">{user.name}</span>
              <a
                href="/login"
                className="icon-link"
                onClick={(e) => {
                  e?.preventDefault();
                  onLogout();
                }}
              >
                <FormattedMessage id="log.out" />
              </a>
            </p>
            <p className="m-0 mt-2 d-flex gap-3 justify-content-end align-items-baseline">
              <Link className="icon-link" to="/account">
                <FormattedMessage id="header.my.account" />
              </Link>
              <LanguageSwitcher />
            </p>
          </>
        )}
      </div>
    </header>
  </>
);
