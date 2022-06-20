import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';

import './LoginForm.scss';
import LoginTabs from './LoginTabs';
import { Maintenance } from '../Maintenance';

function runWithDefaultPrevention(fn) {
  return (event) => {
    event.preventDefault();
    fn();
  };
}

export const LoginForm = ({
  phoneNumber,
  personalCode,
  onPhoneNumberChange,
  onPersonalCodeChange,
  onMobileIdSubmit,
  onIdCodeSubmit,
  onAuthenticateWithIdCard,
  monthlyThirdPillarContribution,
  exchangeExistingThirdPillarUnits,
}) => {
  return (
    <div className="row mt-4 pt-4 pb-4 justify-content-center login-form">
      {isMaintenanceWindow() ? (
        <Maintenance />
      ) : (
        renderLoginForm(
          monthlyThirdPillarContribution,
          exchangeExistingThirdPillarUnits,
          onIdCodeSubmit,
          personalCode,
          onPersonalCodeChange,
          onMobileIdSubmit,
          phoneNumber,
          onPhoneNumberChange,
          onAuthenticateWithIdCard,
        )
      )}
    </div>
  );
};

const isMaintenanceWindow = () => {
  const currentTime = new Date();
  const maintenanceStart = new Date('June 20, 2022 20:00:00');
  const maintenanceEnd = new Date('June 20, 2022 23:00:00');
  return currentTime >= maintenanceStart && currentTime <= maintenanceEnd;
};

const renderLoginForm = (
  monthlyThirdPillarContribution,
  exchangeExistingThirdPillarUnits,
  onIdCodeSubmit,
  personalCode,
  onPersonalCodeChange,
  onMobileIdSubmit,
  phoneNumber,
  onPhoneNumberChange,
  onAuthenticateWithIdCard,
) => {
  const { formatMessage } = useIntl();

  return (
    <>
      <div className="col-lg-9">
        <div className="mt-2 mb-4">
          {monthlyThirdPillarContribution ? (
            renderMonthlyThirdPillarNotice(
              exchangeExistingThirdPillarUnits,
              monthlyThirdPillarContribution,
            )
          ) : (
            <h3>
              <FormattedMessage id="login.title" />
            </h3>
          )}
        </div>

        {renderLoginTabs(
          onIdCodeSubmit,
          personalCode,
          onPersonalCodeChange,
          onMobileIdSubmit,
          phoneNumber,
          onPhoneNumberChange,
          onAuthenticateWithIdCard,
          formatMessage,
        )}
      </div>

      <div className="col-lg-9 mt-4">
        <FormattedMessage
          id="login.permission.note"
          values={{
            a: (chunks) => (
              <a href={formatMessage({ id: 'login.permission.note.url' })}>{chunks}</a>
            ),
          }}
        />
      </div>
    </>
  );
};

const renderMonthlyThirdPillarNotice = (
  exchangeExistingThirdPillarUnits,
  monthlyThirdPillarContribution,
) => (
  <>
    <h3 className="mb-4">
      {exchangeExistingThirdPillarUnits ? (
        <FormattedMessage
          id="login.title.thirdPillar.withExchange"
          values={{ monthlyContribution: monthlyThirdPillarContribution }}
        />
      ) : (
        <FormattedMessage
          id="login.title.thirdPillar.withoutExchange"
          values={{ monthlyContribution: monthlyThirdPillarContribution }}
        />
      )}
    </h3>

    <h3>
      <FormattedMessage id="login.subtitle.thirdPillar" />
    </h3>
  </>
);

const renderLoginTabs = (
  onIdCodeSubmit,
  personalCode,
  onPersonalCodeChange,
  onMobileIdSubmit,
  phoneNumber,
  onPhoneNumberChange,
  onAuthenticateWithIdCard,
  formatMessage,
) => (
  <LoginTabs>
    {renderSmartId(onIdCodeSubmit, personalCode, onPersonalCodeChange, formatMessage)}
    {renderMobileId(
      onMobileIdSubmit,
      phoneNumber,
      personalCode,
      onPersonalCodeChange,
      formatMessage,
      onPhoneNumberChange,
    )}
    {renderIdCard(onAuthenticateWithIdCard)}
  </LoginTabs>
);

const renderSmartId = (onIdCodeSubmit, personalCode, onPersonalCodeChange, formatMessage) => (
  <div label="login.smart.id" hideOnMobile="false">
    <form onSubmit={runWithDefaultPrevention(() => onIdCodeSubmit(personalCode))}>
      <div className="form-group">
        <input
          id="smart-id-personal-code"
          type="number"
          value={personalCode}
          onChange={(event) => onPersonalCodeChange(event.target.value)}
          className="form-control form-control-lg"
          placeholder={formatMessage({ id: 'login.id.code' })}
        />
      </div>
      <div className="form-group">
        <input
          id="smart-id-submit"
          type="submit"
          className="btn btn-primary btn-block btn-lg"
          disabled={!personalCode}
          value={formatMessage({ id: 'login.enter' })}
        />
      </div>
    </form>
  </div>
);

const renderMobileId = (
  onMobileIdSubmit,
  phoneNumber,
  personalCode,
  onPersonalCodeChange,
  formatMessage,
  onPhoneNumberChange,
) => (
  <div label="login.mobile.id" hideOnMobile="false">
    <form onSubmit={runWithDefaultPrevention(() => onMobileIdSubmit(phoneNumber, personalCode))}>
      <div className="form-group">
        <input
          id="mobile-id-personal-code"
          type="number"
          value={personalCode}
          onChange={(event) => onPersonalCodeChange(event.target.value)}
          className="form-control form-control-lg"
          placeholder={formatMessage({ id: 'login.id.code' })}
        />
      </div>
      <div className="form-group">
        <input
          id="mobile-id-number"
          type="tel"
          value={phoneNumber}
          onChange={(event) => onPhoneNumberChange(event.target.value)}
          className="form-control form-control-lg"
          placeholder={formatMessage({ id: 'login.phone.number' })}
        />
      </div>
      <div className="form-group">
        <input
          id="mobile-id-submit"
          type="submit"
          className="btn btn-primary btn-block btn-lg"
          disabled={!phoneNumber || !personalCode}
          value={formatMessage({ id: 'login.enter' })}
        />
      </div>
    </form>
  </div>
);

const renderIdCard = (onAuthenticateWithIdCard) => (
  <div label="login.id.card" hideOnMobile="true">
    <div>
      <button
        type="button"
        className="btn btn-primary btn-block btn-lg"
        onClick={onAuthenticateWithIdCard}
      >
        <FormattedMessage id="login.enter" />
      </button>
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

export default LoginForm;
