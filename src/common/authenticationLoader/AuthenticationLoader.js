import React, { PropTypes as Types } from 'react';
import { Message } from 'retranslate';

import { Loader } from '../../common';
import './AuthenticationLoader.scss';

const AuthenticationLoader = ({ controlCode, onCancel, overlayed }) => {
  const content = (
    <div className="card text-center p-4">
      <div className="p-4">
        {
          controlCode ? (
            <div>
              <p><Message>login.control.code</Message></p>
              <div className="control-code">{controlCode}</div>
            </div>
          ) : ''
        }
        <Loader className="align-middle" />
        {
          controlCode ? (
            <button className="btn btn-secondary mt-4" onClick={onCancel}>
              <Message>login.stop</Message>
            </button>
          ) : ''
        }
      </div>
    </div>
  );
  if (overlayed) {
    return (
      <div className="tv-modal">
        <div className="container">
          <div className="row mt-4 pt-4 justify-content-center">
            <div className="col-md-8 col-lg-6 tv-modal__content">
              {content}
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={'row mt-4 pt-4 justify-content-center'}>
      <div className="col-md-8 col-lg-6">
        {content}
      </div>
    </div>
  );
};

const noop = () => null;

AuthenticationLoader.defaultProps = {
  controlCode: null,
  onCancel: noop,
  overlayed: false,
};

AuthenticationLoader.propTypes = {
  controlCode: Types.string,
  onCancel: Types.func,
  overlayed: Types.bool,
};

export default AuthenticationLoader;
