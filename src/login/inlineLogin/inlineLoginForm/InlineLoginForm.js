import React, { Component, PropTypes as Types } from 'react';
import { Message, withTranslations } from 'retranslate';

import './InlineLoginForm.scss';

function runWithDefaultPrevention(fn) {
  return (event) => {
    event.preventDefault();
    fn();
  };
}
export class InlineLoginForm extends Component {

  constructor(props) {
    super(props);
    this.state = {
    };
  }

  render() {
    const {
      translations: { translate },
      phoneNumber,
      onPhoneNumberChange,
      onPhoneNumberSubmit,
      onAuthenticateWithIdCard,
    } = this.props;

    return (
      <div>
        <div className="login-form">
          <form onSubmit={runWithDefaultPrevention(() => onPhoneNumberSubmit(phoneNumber))}>
            <div>
              <div className="row">
                <div className="col">
                  <input
                    id="mobile-id-number"
                    type="tel"
                    value={phoneNumber}
                    onChange={event => onPhoneNumberChange(event.target.value)}
                    className="form-control form-control-lg"
                    placeholder={translate('login.phone.number')}
                  />
                </div>
                <div className="col">
                  <input
                    id="mobile-id-submit"
                    type="submit"
                    className="btn btn-primary btn-block btn-lg"
                    disabled={!phoneNumber}
                    value={translate('login.mobile.id')}
                  />
                </div>
                <div className="col">
                  <button
                    className="btn btn-primary btn-block btn-lg"
                    onClick={onAuthenticateWithIdCard}
                  >
                    <Message>login.id.card</Message>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div className="col-lg-9 mt-4">
          <Message>login.permission.note</Message>
        </div>
      </div>
    );
  }
}

const noop = () => null;

InlineLoginForm.defaultProps = {
  onPhoneNumberChange: noop,
  onPhoneNumberSubmit: noop,
  onAuthenticateWithIdCard: noop,

  phoneNumber: '',
};

InlineLoginForm.propTypes = {
  translations: Types.shape({ translate: Types.func.isRequired }).isRequired,

  onPhoneNumberChange: Types.func,
  onPhoneNumberSubmit: Types.func,
  onAuthenticateWithIdCard: Types.func,

  phoneNumber: Types.string,
};

export default withTranslations(InlineLoginForm);
