import React, { PropTypes as Types } from 'react';
import { Message } from 'retranslate';

const NOT_JOINED_ERROR_DESCRIPTION = 'INVALID_USER_CREDENTIALS';

const ErrorAlert = ({ description }) => (
  <div className="row mt-4 pt-4 justify-content-center">
    <div className="alert alert-danger">
      {
        description === NOT_JOINED_ERROR_DESCRIPTION ? (
          <div>
            <Message>login.error.invalid.user.credentials</Message><br />
            <a href="//tuleva.ee/#liitu"><Message>login.join.tuleva</Message></a>
          </div>
        ) : <Message>login.error.generic</Message>
      }
    </div>
  </div>
);

ErrorAlert.defaultProps = { description: '' };
ErrorAlert.propTypes = { description: Types.string };

export default ErrorAlert;
