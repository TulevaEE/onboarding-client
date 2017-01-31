import React, { PropTypes as Types } from 'react';
import { Message } from 'retranslate';

import { Loader } from '../../common';

const AuthenticationLoader = ({ controlCode }) => (
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
        </div>
      </div>
    </div>
  </div>
);

AuthenticationLoader.defaultProps = {
  controlCode: null,
};

AuthenticationLoader.propTypes = {
  controlCode: Types.string,
};

export default AuthenticationLoader;
