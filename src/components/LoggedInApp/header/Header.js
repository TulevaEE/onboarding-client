import React from 'react';
import { PropTypes as Types } from 'prop-types';

import { FormattedMessage } from 'react-intl';
import { Loader, logo } from '../../common';
import LanguageSwitcher from './languageSwitcher';

const Header = ({ user: { name } = {}, loading, onLogout }) => (
  <>
    <div className="d-flex justify-content-between align-items-end border-bottom pb-4 mb-5 app-header">
      <a href="/account">
        <img src={logo} alt="Tuleva" className="brand-logo" />
      </a>
      <div className="text-right">
        {loading || !name ? (
          <Loader className="align-right" />
        ) : (
          <>
            <p className="m-0">
              <span className="text-body">{name}</span>
              <span className="text-secondary">&ensp;&middot;&ensp;</span>
              <button type="button" className="btn btn-link p-0 border-0" onClick={onLogout}>
                <FormattedMessage id="log.out" />
              </button>
            </p>
            <p className="m-0 mt-1">
              <a className="btn btn-link p-0 border-0" href="/account">
                <FormattedMessage id="header.my.account" />
              </a>
              <span className="text-secondary">&ensp;&middot;&ensp;</span>
              <LanguageSwitcher />
            </p>
          </>
        )}
      </div>
    </div>
  </>
);

const noop = () => null;

Header.defaultProps = {
  user: {},
  loading: false,
  onLogout: noop,
};

Header.propTypes = {
  user: Types.shape({ name: Types.string }),
  loading: Types.bool,
  onLogout: Types.func,
};

export default Header;
