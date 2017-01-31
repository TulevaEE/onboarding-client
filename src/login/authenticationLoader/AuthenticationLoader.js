import React, { PropTypes as Types } from 'react';
import { Message } from 'retranslate';

import { Loader } from '../../common';

const AuthenticationLoader = ({ controlCode, onCancel }) => (
  <div className="row mt-4 pt-4 justify-content-center">
    <div className="col-md-8 col-lg-6">
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
          <Loader />
          <button className="btn btn-secondary mt-4" onClick={onCancel}>
            <Message>login.stop</Message>
          </button>
        </div>
      </div>
    </div>
  </div>
);

const noop = () => null;

AuthenticationLoader.defaultProps = {
  controlCode: null,
  onCancel: noop,
};

AuthenticationLoader.propTypes = {
  controlCode: Types.string,
  onCancel: Types.func,
};

export default AuthenticationLoader;
