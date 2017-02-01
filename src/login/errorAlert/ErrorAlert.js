import React, { PropTypes as Types } from 'react';
import { Message } from 'retranslate';

const NOT_JOINED_ERROR_DESCRIPTION = 'INVALID_USER_CREDENTIALS';

const ErrorAlert = ({ description }) => (
  <div className="row mt-4 pt-4 justify-content-center">
    <div className="col-md-8 col-lg-6">
      <div className="alert alert-danger">
        {
          description === NOT_JOINED_ERROR_DESCRIPTION ? (
            <div>
              <Message>login.error.invalid.user.credentials</Message><br />
              <a href="https://tuleva.ee/#liitu"><Message>login.join.tuleva</Message></a>
            </div>
          ) : <Message>login.error.generic</Message>
        }
      </div>
    </div>
  </div>
);

ErrorAlert.defaultProps = { description: '' };
ErrorAlert.propTypes = { description: Types.string };

export default ErrorAlert;
