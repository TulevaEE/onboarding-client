import React, { PropTypes as Types } from 'react';
import { Link } from 'react-router';
import { Message } from 'retranslate';

import { logo, Loader } from '../../common';

const Header = ({ user: { name } = {}, loading, onLogout }) => (
  <div className="row">
    <div className="col align-self-start">
      <img src={logo} alt="Tuleva" className="img-responsive brand-logo" />
    </div>
    <div className="col align-self-end text-right">
      {
        loading || !name ?
          <Loader className="align-right" /> :
          (
            <small>
              <b>{name}</b> <br />
              <Link className="btn btn-link pl-0 py-0 pr-1" to="/account">
                <Message>header.my.account</Message>
              </Link> <br />
              <button className="btn btn-link pl-0 py-0 pr-1" onClick={onLogout}>
                <Message>log.out</Message>
              </button>
            </small>
          )
      }
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
