import React, { Component } from 'react';
import { PropTypes as Types } from 'prop-types';
import { FormattedMessage } from 'react-intl';

export const ID_CARD_LOGIN_START_FAILED_ERROR = 'ID_CARD_LOGIN_START_FAILED';
export const WEB_EID_USER_CANCELLED = 'WEB_EID_USER_CANCELLED';
export const WEB_EID_EXTENSION_UNAVAILABLE = 'WEB_EID_EXTENSION_UNAVAILABLE';
const NOT_JOINED_ERROR_DESCRIPTION = 'INVALID_USER_CREDENTIALS';
const INVALID_PERSONAL_CODE = 'ValidPersonalCode';

class ErrorAlert extends Component {
  errorMessage() {
    const { description } = this.props;

    // TODO: Check and remove legacy logic. It should not be needed after moving to ID authentication.
    if (description === NOT_JOINED_ERROR_DESCRIPTION) {
      return (
        <div>
          <FormattedMessage id="login.error.invalid.user.credentials" />
          <br />
          <a href="//tuleva.ee/#liitu">
            <FormattedMessage id="login.join.tuleva" />
          </a>
        </div>
      );
    }

    if (description === ID_CARD_LOGIN_START_FAILED_ERROR) {
      return (
        <div>
          <FormattedMessage id="login.id.card.start.failed" />
        </div>
      );
    }

    if (description === WEB_EID_USER_CANCELLED) {
      return (
        <div>
          <FormattedMessage id="login.web.eid.user.cancelled" />
        </div>
      );
    }

    if (description === WEB_EID_EXTENSION_UNAVAILABLE) {
      return (
        <div>
          <FormattedMessage id="login.web.eid.extension.unavailable" />
        </div>
      );
    }

    if (description === INVALID_PERSONAL_CODE) {
      return (
        <div>
          <FormattedMessage id="login.invalid.personal.code" />
        </div>
      );
    }

    return <FormattedMessage id="login.error.generic" />;
  }

  render() {
    return (
      <div className="alert alert-danger" role="alert">
        {this.errorMessage()}
      </div>
    );
  }
}

ErrorAlert.defaultProps = { description: '' };
ErrorAlert.propTypes = { description: Types.string };

export default ErrorAlert;
