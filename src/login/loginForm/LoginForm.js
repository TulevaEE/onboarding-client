import React, { PropTypes as Types } from 'react';
import { Message, withTranslations } from 'retranslate';

export const LoginForm = ({
  translations: { translate },
  phoneNumber,
  onPhoneNumberChange,
  onPhoneNumberSubmit,
}) => (
  <div className="row mt-4 pt-4 justify-content-center">
    <div className="col-sm-6 col-md-4 col-lg-3">
      <form onSubmit={event => event.preventDefault() && onPhoneNumberSubmit(phoneNumber)}>
        <div className="form-group">
          <label htmlFor="mobile-id-number" className="lead">
            <Message>login.mobile.id</Message>
          </label>
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
            value={translate('login.enter')}
          />
        </div>
      </form>
    </div>
  </div>
);

const noop = () => null;

LoginForm.defaultProps = {
  onPhoneNumberChange: noop,
  onPhoneNumberSubmit: noop,

  phoneNumber: '',
};

LoginForm.propTypes = {
  translations: Types.shape({ translate: Types.func.isRequired }).isRequired,

  onPhoneNumberChange: Types.func,
  onPhoneNumberSubmit: Types.func,

  phoneNumber: Types.string,
};

export default withTranslations(LoginForm);
