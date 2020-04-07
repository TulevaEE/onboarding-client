import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { Message, withTranslations } from 'retranslate';

import './LoginForm.scss';
import LoginTabs from './LoginTabs';

function runWithDefaultPrevention(fn) {
  return event => {
    event.preventDefault();
    fn();
  };
}

export const LoginForm = ({
  translations: { translate },
  phoneNumber,
  personalCode,
  onPhoneNumberChange,
  onPersonalCodeChange,
  onMobileIdSubmit,
  onIdCodeSubmit,
  onAuthenticateWithIdCard,
  monthlyThirdPillarContribution,
  exchangeExistingThirdPillarUnits,
}) => (
  <div className="row mt-4 pt-4 pb-4 justify-content-center login-form">
    <div className="col-lg-9">
      <div className="mt-2 mb-4">
        {monthlyThirdPillarContribution ? (
          <>
            <h3 className="mb-4">
              {exchangeExistingThirdPillarUnits ? (
                <Message
                  params={{
                    monthlyContribution: monthlyThirdPillarContribution,
                  }}
                >
                  login.title.thirdPillar.withExchange
                </Message>
              ) : (
                <Message
                  params={{
                    monthlyContribution: monthlyThirdPillarContribution,
                  }}
                >
                  login.title.thirdPillar.withoutExchange
                </Message>
              )}
            </h3>

            <h3>
              <Message>login.subtitle.thirdPillar</Message>
            </h3>
          </>
        ) : (
          <h3>
            <Message>login.title</Message>
          </h3>
        )}
      </div>
      <LoginTabs>
        <div label="login.smart.id" hideOnMobile="false">
          <form onSubmit={runWithDefaultPrevention(() => onIdCodeSubmit(personalCode))}>
            <div className="form-group">
              <input
                id="smart-id-personal-code"
                type="number"
                value={personalCode}
                onChange={event => onPersonalCodeChange(event.target.value)}
                className="form-control form-control-lg"
                placeholder={translate('login.id.code')}
              />
            </div>
            <div className="form-group">
              <input
                id="smart-id-submit"
                type="submit"
                className="btn btn-primary btn-block btn-lg"
                disabled={!personalCode}
                value={translate('login.enter')}
              />
            </div>
          </form>
        </div>
        <div label="login.mobile.id" hideOnMobile="false">
          <form
            onSubmit={runWithDefaultPrevention(() => onMobileIdSubmit(phoneNumber, personalCode))}
          >
            <div className="form-group">
              <input
                id="mobile-id-personal-code"
                type="number"
                value={personalCode}
                onChange={event => onPersonalCodeChange(event.target.value)}
                className="form-control form-control-lg"
                placeholder={translate('login.id.code')}
              />
            </div>
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
                disabled={!phoneNumber || !personalCode}
                value={translate('login.enter')}
              />
            </div>
          </form>
        </div>
        <div label="login.id.card" hideOnMobile="true">
          <div>
            <button
              type="button"
              className="btn btn-primary btn-block btn-lg"
              onClick={onAuthenticateWithIdCard}
            >
              <Message>login.enter</Message>
            </button>
          </div>
        </div>
      </LoginTabs>
    </div>
    <div className="col-lg-9 mt-4">
      <Message>login.permission.note</Message>
    </div>
  </div>
);

const noop = () => null;

LoginForm.defaultProps = {
  onPhoneNumberChange: noop,
  onPersonalCodeChange: noop,
  onMobileIdSubmit: noop,
  onIdCodeSubmit: noop,
  onAuthenticateWithIdCard: noop,

  phoneNumber: '',
  personalCode: '',
  monthlyThirdPillarContribution: null,
  exchangeExistingThirdPillarUnits: false,
};

LoginForm.propTypes = {
  translations: Types.shape({ translate: Types.func.isRequired }).isRequired,

  onPhoneNumberChange: Types.func,
  onPersonalCodeChange: Types.func,
  onMobileIdSubmit: Types.func,
  onIdCodeSubmit: Types.func,
  onAuthenticateWithIdCard: Types.func,

  phoneNumber: Types.string,
  personalCode: Types.string,
  monthlyThirdPillarContribution: Types.number,
  exchangeExistingThirdPillarUnits: Types.bool,
};

export default withTranslations(LoginForm);
