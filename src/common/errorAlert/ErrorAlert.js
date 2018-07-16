import React, { Component } from 'react';
import { PropTypes as Types } from 'prop-types';
import { Message } from 'retranslate';

export const ID_CARD_LOGIN_START_FAILED_ERROR = 'ID_CARD_LOGIN_START_FAILED';
const NOT_JOINED_ERROR_DESCRIPTION = 'INVALID_USER_CREDENTIALS';

export class ErrorAlert extends Component {
  errorMessage() {
    if (this.props.description === NOT_JOINED_ERROR_DESCRIPTION) {
      return (<div>
        <Message>login.error.invalid.user.credentials</Message><br />
        <a href="//tuleva.ee/#liitu"><Message>login.join.tuleva</Message></a>
      </div>);
    } else if (this.props.description === ID_CARD_LOGIN_START_FAILED_ERROR) {
      return (<div>
        <Message>login.id.card.start.failed</Message>
      </div>);
    }
    return <Message>login.error.generic</Message>;
  }

  render() {
    return (
      <div className="row mt-4 pt-4 justify-content-center">
        <div className="alert alert-danger">
          { this.errorMessage() }
        </div>
      </div>
    );
  }
}

ErrorAlert.defaultProps = { description: '' };
ErrorAlert.propTypes = { description: Types.string };

export default ErrorAlert;
