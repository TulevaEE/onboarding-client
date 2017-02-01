import React, { PropTypes as Types } from 'react';
import { Message } from 'retranslate';

import { logo, Loader } from '../../common';

const Header = ({ user: { name, personalCode } = {}, loading, onLogout }) => (
  <div className="row">
    <div className="col align-self-start">
      <img src={logo} alt="Tuleva" className="img-responsive brand-logo" />
    </div>
    <div className="col align-self-end text-right pr-0">
      {
        loading || !(name || personalCode) ?
          <Loader className="align-right" /> :
          (
            <small>
              <b>{name}</b> <br />
              {personalCode} <br />
              <button className="btn btn-link p-0" onClick={onLogout}>
                <Message>log.out</Message>
              </button>
            </small>
          )
      }
    </div>
    <div className="col-12 my-2 px-0">
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
  user: Types.shape({ name: Types.string, personalCode: Types.string }),
  loading: Types.bool,
  onLogout: Types.func,
};

export default Header;
