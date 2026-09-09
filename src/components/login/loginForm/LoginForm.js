import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';

import LoginTabs from './LoginTabs';
import { IdCardLoginTab } from './IdCardLoginTab';
import { SmartIdLoginTab } from './SmartIdLoginTab';
import { MobileIdLoginTab } from '../mobileId/MobileIdLoginTab';
import { Maintenance } from '../Maintenance';

export const LoginForm = ({
  phoneNumber,
  personalCode,
  onPhoneNumberChange,
  onPersonalCodeChange,
  onMobileIdSubmit,
  onSmartIdLoginStart,
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
        onSmartIdLoginStart,
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
  const maintenanceStart = new Date('April 21, 2026 20:00:00');
  const maintenanceEnd = new Date('April 21, 2026 22:00:00');
  return currentTime >= maintenanceStart && currentTime <= maintenanceEnd;
};

const renderLoginForm = (
  monthlyThirdPillarContribution,
  exchangeExistingThirdPillarUnits,
  onSmartIdLoginStart,
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
        onSmartIdLoginStart,
        personalCode,
        onPersonalCodeChange,
        onMobileIdSubmit,
        phoneNumber,
        onPhoneNumberChange,
        onAuthenticateWithIdCard,
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
  onSmartIdLoginStart,
  personalCode,
  onPersonalCodeChange,
  onMobileIdSubmit,
  phoneNumber,
  onPhoneNumberChange,
  onAuthenticateWithIdCard,
) => (
  <LoginTabs>
    {/* eslint-disable-next-line react/no-unknown-property */}
    <div label="login.smart.id">
      <SmartIdLoginTab onSmartIdLoginStart={onSmartIdLoginStart} />
    </div>
    {/* eslint-disable-next-line react/no-unknown-property */}
    <div label="login.mobile.id">
      <MobileIdLoginTab
        phoneNumber={phoneNumber}
        personalCode={personalCode}
        onPhoneNumberChange={onPhoneNumberChange}
        onPersonalCodeChange={onPersonalCodeChange}
        onMobileIdSubmit={onMobileIdSubmit}
      />
    </div>
    {/* eslint-disable-next-line react/no-unknown-property */}
    <div label="login.id.card" hideOnMobile>
      <IdCardLoginTab onAuthenticateWithIdCardMtls={onAuthenticateWithIdCard} />
    </div>
  </LoginTabs>
);

const noop = () => null;

LoginForm.defaultProps = {
  onPhoneNumberChange: noop,
  onPersonalCodeChange: noop,
  onMobileIdSubmit: noop,
  onSmartIdLoginStart: noop,
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
  onSmartIdLoginStart: Types.func,
  onAuthenticateWithIdCard: Types.func,

  phoneNumber: Types.string,
  personalCode: Types.string,
  monthlyThirdPillarContribution: Types.number,
  exchangeExistingThirdPillarUnits: Types.bool,
};

export default LoginForm;
