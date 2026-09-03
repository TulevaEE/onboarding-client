import React, { Component } from 'react';
import { PropTypes as Types } from 'prop-types';
import { FormattedMessage } from 'react-intl';

export const ID_CARD_LOGIN_START_FAILED_ERROR = 'ID_CARD_LOGIN_START_FAILED';
export const SMART_ID_CALLBACK_FAILED_ERROR = 'SMART_ID_CALLBACK_FAILED';
export const WEB_EID_USER_CANCELLED = 'WEB_EID_USER_CANCELLED';
export const WEB_EID_EXTENSION_UNAVAILABLE = 'WEB_EID_EXTENSION_UNAVAILABLE';
const NOT_JOINED_ERROR_DESCRIPTION = 'INVALID_USER_CREDENTIALS';
const INVALID_PERSONAL_CODE = 'ValidPersonalCode';
const AUTHENTICATION_ERROR_MESSAGES = {
  'smart.id.user.refused': 'login.error.smart.id.user.refused',
  'smart.id.timeout': 'login.error.smart.id.timeout',
  'smart.id.account.not.found': 'login.error.smart.id.account.not.found',
  'smart.id.unsupported.country': 'login.error.smart.id.unsupported.country',
  'mobile.id.cancelled': 'login.error.mobile.id.cancelled',
  'mobile.id.timeout': 'login.error.mobile.id.timeout',
  'mobile.id.no.signal': 'login.error.mobile.id.no.signal',
  'mobile.id.certificates.revoked': 'login.error.mobile.id.certificates.revoked',
};

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

    if (description === SMART_ID_CALLBACK_FAILED_ERROR) {
      return (
        <div>
          <FormattedMessage id="login.smart.id.callback.failed" />
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

    if (AUTHENTICATION_ERROR_MESSAGES[description]) {
      return (
        <div>
          <FormattedMessage id={AUTHENTICATION_ERROR_MESSAGES[description]} />
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
