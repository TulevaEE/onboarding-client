import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { Message, withTranslations } from 'retranslate';

import './LoginForm.scss';

function runWithDefaultPrevention(fn) {
  return (event) => {
    event.preventDefault();
    fn();
  };
}

export const LoginForm = ({
  translations: { translate },
  phoneNumber,
  onPhoneNumberChange,
  onPhoneNumberSubmit,
  onAuthenticateWithIdCard,
}) => (
  <div className="row mt-4 pt-4 pb-4 justify-content-center login-form">
    <div className="col-lg-9">
      <h3 className="mt-2 mb-4 pb-2">
        <Message>login.title</Message>
      </h3>
      <form onSubmit={runWithDefaultPrevention(() => onPhoneNumberSubmit(phoneNumber))}>
        <div className="form-group">
          <input
            id="mobile-id-number"
            type="tel"
            value={phoneNumber}
            onChange={event => onPhoneNumberChange(event.target.value)}
            className="form-control form-control-lg"
            placeholder={translate('login.phone.number')}
          />
        </div>
        <div className="form-group">
          <input
            id="mobile-id-submit"
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={!phoneNumber}
            value={translate('login.mobile.id')}
          />
        </div>
      </form>
      <div className="login-form__break mt-3 mb-3">
        <span className="ml-2 mr-2">
          <Message>login.or</Message>
        </span>
      </div>
      <div>
        <button className="btn btn-primary btn-block btn-lg" onClick={onAuthenticateWithIdCard}>
          <Message>login.id.card</Message>
        </button>
      </div>
    </div>
    <div className="col-lg-9 mt-4">
      <Message>login.permission.note</Message>
    </div>
  </div>
);

const noop = () => null;

LoginForm.defaultProps = {
  onPhoneNumberChange: noop,
  onPhoneNumberSubmit: noop,
  onAuthenticateWithIdCard: noop,

  phoneNumber: '',
};

LoginForm.propTypes = {
  translations: Types.shape({ translate: Types.func.isRequired }).isRequired,

  onPhoneNumberChange: Types.func,
  onPhoneNumberSubmit: Types.func,
  onAuthenticateWithIdCard: Types.func,

  phoneNumber: Types.string,
};

export default withTranslations(LoginForm);
