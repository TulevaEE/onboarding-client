import React, { Fragment } from 'react';
import { PropTypes as Types } from 'prop-types';
import { Message, withTranslations } from 'retranslate';

import './LoginForm.scss';

function runWithDefaultPrevention(fn) {
  return event => {
    event.preventDefault();
    fn();
  };
}

export const LoginForm = ({
  translations: { translate },
  phoneNumber,
  onPhoneNumberChange,
  onPhoneNumberSubmit,
  identityCode,
  onIdCodeChange,
  onIdCodeSubmit,
  onAuthenticateWithIdCard,
  monthlyThirdPillarContribution,
  exchangeExistingThirdPillarUnits,
}) => (
  <div className="row mt-4 pt-4 pb-4 justify-content-center login-form">
    <div className="col-lg-9">
      <div className="mt-2 mb-4">
        {monthlyThirdPillarContribution ? (
          <Fragment>
            <h3 className="mb-4">
              {exchangeExistingThirdPillarUnits ? (
                <Message params={{ monthlyContribution: monthlyThirdPillarContribution }}>
                  login.title.thirdPillar.withExchange
                </Message>
              ) : (
                <Message params={{ monthlyContribution: monthlyThirdPillarContribution }}>
                  login.title.thirdPillar.withoutExchange
                </Message>
              )}
            </h3>

            <h3>
              <Message>login.subtitle.thirdPillar</Message>
            </h3>
          </Fragment>
        ) : (
          <h3>
            <Message>login.title</Message>
          </h3>
        )}
      </div>

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
      <form onSubmit={runWithDefaultPrevention(() => onIdCodeSubmit(identityCode))}>
        <div className="form-group">
          <input
            id="smart-id-code"
            type="number"
            value={identityCode}
            onChange={event => onIdCodeChange(event.target.value)}
            className="form-control form-control-lg"
            placeholder={translate('login.id.code')}
          />
        </div>
        <div className="form-group">
          <input
            id="smart-id-submit"
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={!identityCode}
            value={translate('login.smart.id')}
          />
        </div>
      </form>
      <div className="login-form__break mt-3 mb-3">
        <span className="ml-2 mr-2">
          <Message>login.or</Message>
        </span>
      </div>
      <div>
        <button
          type="button"
          className="btn btn-primary btn-block btn-lg"
          onClick={onAuthenticateWithIdCard}
        >
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
  onIdCodeChange: noop,
  onIdCodeSubmit: noop,
  onAuthenticateWithIdCard: noop,

  phoneNumber: '',
  identityCode: '',
  monthlyThirdPillarContribution: null,
  exchangeExistingThirdPillarUnits: false,
};

LoginForm.propTypes = {
  translations: Types.shape({ translate: Types.func.isRequired }).isRequired,

  onPhoneNumberChange: Types.func,
  onPhoneNumberSubmit: Types.func,
  onIdCodeChange: Types.func,
  onIdCodeSubmit: Types.func,
  onAuthenticateWithIdCard: Types.func,

  phoneNumber: Types.string,
  identityCode: Types.string,
  monthlyThirdPillarContribution: Types.number,
  exchangeExistingThirdPillarUnits: Types.bool,
};

export default withTranslations(LoginForm);
