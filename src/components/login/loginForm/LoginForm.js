import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';

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
}) => (
  <>
    {isMaintenanceWindow() ? (
      <div className="text-center mb-4">
        <Maintenance />
      </div>
    ) : (
      ''
    )}
    <div className="bg-white shadow-sm rounded-3 p-4 p-sm-5 text-center">
      {renderLoginForm(
        monthlyThirdPillarContribution,
        exchangeExistingThirdPillarUnits,
        onIdCodeSubmit,
        personalCode,
        onPersonalCodeChange,
        onMobileIdSubmit,
        phoneNumber,
        onPhoneNumberChange,
        onAuthenticateWithIdCard,
      )}
    </div>
  </>
);

const isMaintenanceWindow = () => {
  const currentTime = new Date();
  const maintenanceStart = new Date('November 6, 2025 13:30:00');
  const maintenanceEnd = new Date('November 6, 2025 16:00:00');
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
      {monthlyThirdPillarContribution ? (
        renderMonthlyThirdPillarNotice(
          exchangeExistingThirdPillarUnits,
          monthlyThirdPillarContribution,
        )
      ) : (
        <>
          <h2 className="m-0">
            <FormattedMessage id="login.title" />
          </h2>
          <p className="m-0 mt-2 text-body-secondary">
            <FormattedMessage id="login.subtitle" />
          </p>
        </>
      )}

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

      <p className="m-0 mt-4 text-body-secondary">
        <FormattedMessage
          id="login.permission.note"
          values={{
            a: (chunks) => (
              <a href={formatMessage({ id: 'login.permission.note.url' })}>{chunks}</a>
            ),
          }}
        />
      </p>
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
  // eslint-disable-next-line react/no-unknown-property
  <div label="login.smart.id">
    <form onSubmit={runWithDefaultPrevention(() => onIdCodeSubmit(personalCode))}>
      <div className="mb-3">
        <input
          id="smart-id-personal-code"
          type="text"
          inputMode="numeric"
          autoComplete="username"
          value={personalCode}
          onChange={(event) => onPersonalCodeChange(event.target.value)}
          className="form-control form-control-lg"
          placeholder={formatMessage({ id: 'login.id.code' })}
          aria-label={formatMessage({ id: 'login.id.code' })}
        />
      </div>
      <div className="d-grid mb-3">
        <input
          id="smart-id-submit"
          type="submit"
          className="btn btn-primary btn-lg"
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
  // eslint-disable-next-line react/no-unknown-property
  <div label="login.mobile.id">
    <form onSubmit={runWithDefaultPrevention(() => onMobileIdSubmit(phoneNumber, personalCode))}>
      <div className="mb-3">
        <input
          id="mobile-id-personal-code"
          type="text"
          inputMode="numeric"
          autoComplete="username"
          value={personalCode}
          onChange={(event) => onPersonalCodeChange(event.target.value)}
          className="form-control form-control-lg"
          placeholder={formatMessage({ id: 'login.id.code' })}
          aria-label={formatMessage({ id: 'login.id.code' })}
        />
      </div>
      <div className="mb-3">
        <input
          id="mobile-id-number"
          type="tel"
          autoComplete="tel"
          value={phoneNumber}
          onChange={(event) => onPhoneNumberChange(event.target.value)}
          className="form-control form-control-lg"
          placeholder={formatMessage({ id: 'login.phone.number' })}
          aria-label={formatMessage({ id: 'login.phone.number' })}
        />
      </div>
      <div className="d-grid mb-3">
        <input
          id="mobile-id-submit"
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={!phoneNumber || !personalCode}
          value={formatMessage({ id: 'login.enter' })}
        />
      </div>
    </form>
  </div>
);

const renderIdCard = (onAuthenticateWithIdCard) => (
  // eslint-disable-next-line react/no-unknown-property
  <div label="login.id.card" hideOnMobile>
    <div className="d-grid">
      <button type="button" className="btn btn-primary btn-lg" onClick={onAuthenticateWithIdCard}>
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
