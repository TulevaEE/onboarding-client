import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';

import LoginTabs from './LoginTabs';
import { IdCardLoginTab } from './IdCardLoginTab';
import { SmartIdLoginTab } from './SmartIdLoginTab';
import { MobileIdLoginTab } from '../mobileId/MobileIdLoginTab';
import { RememberKnownMobileIdNumbers } from '../mobileId/knownMobileIdNumbers';
import { RememberWhoThisBrowserRemembers } from '../rememberedPeople';
import { Maintenance } from '../Maintenance';

export const LoginForm = ({
  phoneNumber,
  personalCode,
  mobileIdStartError,
  onPhoneNumberChange,
  onPersonalCodeChange,
  onMobileIdSubmit,
  onSmartIdLoginStart,
  onAuthenticateWithIdCard,
  onLoginMethodChange,
  monthlyThirdPillarContribution,
  exchangeExistingThirdPillarUnits,
  alert,
  pendingLogin,
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
        onLoginMethodChange,
        mobileIdStartError,
        alert,
        pendingLogin,
      )}
    </div>
  </>
);

const isMaintenanceWindow = () => {
  const currentTime = new Date();
  const maintenanceStart = new Date('September 22, 2026 20:00:00');
  const maintenanceEnd = new Date('September 22, 2026 22:00:00');
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
  onLoginMethodChange,
  mobileIdStartError,
  alert,
  pendingLogin,
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
          <p className="m-0 mt-2 text-body-secondary text-pretty">
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
        onLoginMethodChange,
        mobileIdStartError,
        alert,
        pendingLogin,
      )}

      <p className="m-0 mt-4 text-body-secondary text-pretty">
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
  onLoginMethodChange,
  mobileIdStartError,
  alert,
  pendingLogin,
) => {
  const panel = (tabContent) => (
    <>
      {alert}
      {pendingLogin || tabContent}
    </>
  );

  return (
    <RememberWhoThisBrowserRemembers>
      <RememberKnownMobileIdNumbers>
        <LoginTabs onTabChange={onLoginMethodChange}>
          {/* eslint-disable-next-line react/no-unknown-property */}
          <div label="login.smart.id">
            {panel(<SmartIdLoginTab onSmartIdLoginStart={onSmartIdLoginStart} />)}
          </div>
          {/* eslint-disable-next-line react/no-unknown-property */}
          <div label="login.mobile.id">
            {panel(
              <MobileIdLoginTab
                phoneNumber={phoneNumber}
                personalCode={personalCode}
                onPhoneNumberChange={onPhoneNumberChange}
                onPersonalCodeChange={onPersonalCodeChange}
                onMobileIdSubmit={onMobileIdSubmit}
                startError={mobileIdStartError}
              />,
            )}
          </div>
          {/* eslint-disable-next-line react/no-unknown-property */}
          <div label="login.id.card" hideOnMobile>
            {panel(<IdCardLoginTab onAuthenticateWithIdCardMtls={onAuthenticateWithIdCard} />)}
          </div>
        </LoginTabs>
      </RememberKnownMobileIdNumbers>
    </RememberWhoThisBrowserRemembers>
  );
};

const noop = () => null;

LoginForm.defaultProps = {
  onPhoneNumberChange: noop,
  onPersonalCodeChange: noop,
  onMobileIdSubmit: noop,
  onSmartIdLoginStart: noop,
  onAuthenticateWithIdCard: noop,
  onLoginMethodChange: noop,

  phoneNumber: '',
  personalCode: '',
  mobileIdStartError: null,
  monthlyThirdPillarContribution: null,
  exchangeExistingThirdPillarUnits: false,
  alert: null,
  pendingLogin: null,
};

LoginForm.propTypes = {
  onPhoneNumberChange: Types.func,
  onPersonalCodeChange: Types.func,
  onMobileIdSubmit: Types.func,
  onSmartIdLoginStart: Types.func,
  onAuthenticateWithIdCard: Types.func,
  onLoginMethodChange: Types.func,

  phoneNumber: Types.string,
  personalCode: Types.string,
  mobileIdStartError: Types.string,
  monthlyThirdPillarContribution: Types.number,
  exchangeExistingThirdPillarUnits: Types.bool,
  alert: Types.node,
  pendingLogin: Types.node,
};

export default LoginForm;
