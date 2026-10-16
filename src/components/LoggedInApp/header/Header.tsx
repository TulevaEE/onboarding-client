import React from 'react';

import { FormattedMessage } from 'react-intl';
import config from 'react-global-configuration';
import { logo } from '../../common';
import { Shimmer } from '../../common/shimmer/Shimmer';
import { RoleSwitcher } from './roleSwitcher';

type Props = {
  // TODO move to useMe hook here
  user: { name: string };
  onLogout: () => unknown;
  onRoleSwitch?: () => void;
  hackathon?: boolean;
};

export const Header = ({ user, onLogout, onRoleSwitch, hackathon = false }: Props) => (
  <>
    <a className="skip-link visually-hidden-focusable" href="#main">
      <FormattedMessage id="global.skipToContent" />
    </a>
    <header className="d-flex justify-content-between align-items-end gap-3 border-bottom py-4 mb-5 app-header">
      <div className="app-header__brand flex-shrink-0">
        {config.get('language') === 'et' ? (
          <a href="/account">
            <img src={logo} alt="Tuleva" className="brand-logo" />
          </a>
        ) : (
          <a href="/account?language=en">
            <img src={logo} alt="Tuleva" className="brand-logo" />
          </a>
        )}
        {hackathon && (
          <a href="/hackathon" className="hackathon-brand-sub">
            <span className="hackathon-brand-sub__top">
              <FormattedMessage id="hackathon.label.members" />
            </span>{' '}
            <FormattedMessage id="hackathon.label" />
          </a>
        )}
      </div>
      {!user?.name ? (
        <div style={{ width: '200px' }}>
          <Shimmer height={32} />
        </div>
      ) : (
        <RoleSwitcher userName={user.name} onRoleSwitch={onRoleSwitch} onLogout={onLogout} />
      )}
    </header>
  </>
);
