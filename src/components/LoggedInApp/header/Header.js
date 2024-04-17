import React from 'react';
import { PropTypes as Types } from 'prop-types';

import { FormattedMessage } from 'react-intl';
import { Loader, logo } from '../../common';
import LanguageSwitcher from './languageSwitcher';

const Header = ({ user: { name } = {}, loading, onLogout }) => (
  <div className="row">
    <div className="col align-self-start">
      <a href="/account">
        <img src={logo} alt="Tuleva" className="img-responsive brand-logo" />
      </a>
    </div>
    <div className="col align-self-end text-right">
      {loading || !name ? (
        <Loader className="align-right" />
      ) : (
        <span>
          {name}
          <br />
          <button type="button" className="btn btn-link p-0 border-0" onClick={onLogout}>
            <FormattedMessage id="log.out" />
          </button>
          <br />
          <LanguageSwitcher />
          &ensp;&middot;&ensp;
          <a className="btn btn-link p-0 border-0" href="/account">
            <FormattedMessage id="header.my.account" />
          </a>
        </span>
      )}
    </div>
    <div className="col-12 my-3 px-0">
      <hr />
    </div>
  </div>
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
