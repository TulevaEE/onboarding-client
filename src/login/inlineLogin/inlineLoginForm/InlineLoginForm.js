import React, { Component } from 'react';
import { PropTypes as Types } from 'prop-types';
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
        <form
          className="row form-group"
          onSubmit={runWithDefaultPrevention(() => onPhoneNumberSubmit(phoneNumber))}
        >
          <div className="col-sm-4">
            <input
              id="mobile-id-number"
              type="tel"
              value={phoneNumber}
              onChange={event => onPhoneNumberChange(event.target.value)}
              className="form-control form-control-lg input-lg"
              placeholder={translate('login.phone.number')}
            />
          </div>
          <div className="col-sm-4">
            <input
              id="mobile-id-submit"
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={!phoneNumber}
              value={translate('login.mobile.id')}
            />
          </div>
          <div className="col-sm-4">
            <button
              className="btn btn-primary btn-block btn-lg"
              onClick={onAuthenticateWithIdCard}
            >
              <Message>login.id.card</Message>
            </button>
          </div>
        </form>
        <div className="form-group text-center">
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
