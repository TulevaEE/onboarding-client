import React from 'react';

import { FormattedMessage } from 'react-intl';
import config from 'react-global-configuration';
import { logo } from '../../common';
import { Shimmer } from '../../common/shimmer/Shimmer';
import { RoleSwitcher } from './roleSwitcher';

type Props = {
  // TODO move to useMe hook here
  user: { name: string };
  loading: boolean;
  onLogout: () => unknown;
  onRoleSwitch?: () => void;
};

export const Header = ({ user, loading, onLogout, onRoleSwitch }: Props) => (
  <>
    <a className="skip-link visually-hidden-focusable" href="#main">
      <FormattedMessage id="global.skipToContent" />
    </a>
    <header className="d-flex justify-content-between align-items-end border-bottom py-4 mb-5 app-header">
      {config.get('language') === 'et' ? (
        <a href="/account">
          <img src={logo} alt="Tuleva" className="brand-logo" />
        </a>
      ) : (
        <a href="/account?language=en">
          <img src={logo} alt="Tuleva" className="brand-logo" />
        </a>
      )}
      {/* My account, the language choice and logging out all moved into the account
          menu, so the header carries a single control. The logo keeps its own link to
          the account page for anyone who never opens the menu. */}
      {loading || !user ? (
        <div style={{ width: '200px' }}>
          <Shimmer height={32} />
        </div>
      ) : (
        <RoleSwitcher userName={user.name} onRoleSwitch={onRoleSwitch} onLogout={onLogout} />
      )}
    </header>
  </>
);
