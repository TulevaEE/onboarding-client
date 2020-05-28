import React, { Component } from 'react';
import { PropTypes as Types } from 'prop-types';
import { Message } from 'retranslate';

export const ID_CARD_LOGIN_START_FAILED_ERROR = 'ID_CARD_LOGIN_START_FAILED';
const NOT_JOINED_ERROR_DESCRIPTION = 'INVALID_USER_CREDENTIALS';
const INVALID_PERSONAL_CODE = 'ValidPersonalCode';

class ErrorAlert extends Component {
  errorMessage() {
    const { description } = this.props;

    if (description === NOT_JOINED_ERROR_DESCRIPTION) {
      return (
        <div>
          <Message>login.error.invalid.user.credentials</Message>
          <br />
          <a href="//tuleva.ee/#liitu">
            <Message>login.join.tuleva</Message>
          </a>
        </div>
      );
    }

    if (description === ID_CARD_LOGIN_START_FAILED_ERROR) {
      return (
        <div>
          <Message>login.id.card.start.failed</Message>
        </div>
      );
    }

    if (description === INVALID_PERSONAL_CODE) {
      return (
        <div>
          <Message>login.invalid.personal.code</Message>
        </div>
      );
    }

    return <Message>login.error.generic</Message>;
  }

  render() {
    return (
      <div className="row mt-4 pt-4 justify-content-center">
        <div className="alert alert-danger">{this.errorMessage()}</div>
      </div>
    );
  }
}

ErrorAlert.defaultProps = { description: '' };
ErrorAlert.propTypes = { description: Types.string };

export default ErrorAlert;
