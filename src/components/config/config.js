import config from 'react-global-configuration';

const DEFAULT_CONF_DEV = {
  mixpanelKey: 'be355b17352ad6b4660ae595cd65ce61',
  applicationUrl: 'http://localhost:3000',
  newUserPaymentRedirectBaseUrl:
    'https://payment.test.maksekeskus.ee/pay/1/link.html?shopId=322a5e5e-37ee-45b1-8961-ebd00e84e209&amount=125',
  clientCredentialsAccessToken: '6b338ba2-805c-4300-9341-b38bb4ad34a9',
  language: 'et',
  idCardUrl: 'https://id.tuleva.ee',
};

const DEFAULT_CONF_PRODUCTION = {
  mixpanelKey: 'ff49493de3c6ed27e198e6b15063b60f',
  applicationUrl: 'https://pension.tuleva.ee',
  newUserPaymentRedirectBaseUrl:
    'https://payment.maksekeskus.ee/pay/1/link.html?shopId=8c1a6c0a-2467-4166-ab47-006ddbf38b06&amount=125&return_url=https://onboarding-service.tuleva.ee/notifications/payments&return_method=POST&cancel_url=https://pension.tuleva.ee&cancel_method=GET&notification_url=https://onboarding-service.tuleva.ee/notifications/payments&notification_method=POST',
  clientCredentialsAccessToken: '705e26c1-9316-47f2-94b8-a5c6b0dfb566',
  language: 'et',
  idCardUrl: 'https://id.tuleva.ee',
};

const DEFAULT_CONF_STAGING = {
  mixpanelKey: 'be355b17352ad6b4660ae595cd65ce61',
  applicationUrl: 'https://staging.tuleva.ee',
  newUserPaymentRedirectBaseUrl:
    'https://payment.test.maksekeskus.ee/pay/1/link.html?shopId=322a5e5e-37ee-45b1-8961-ebd00e84e209&amount=125',
  clientCredentialsAccessToken: '6b338ba2-805c-4300-9341-b38bb4ad34a9',
  language: 'et',
  idCardUrl: 'https://id-staging.tuleva.ee',
};

const DEFAULT_CONF_TEST = {
  mixpanelKey: undefined,
  applicationUrl: 'http://localhost',
  newUserPaymentRedirectBaseUrl: undefined,
  clientCredentialsAccessToken: undefined,
  language: 'en',
  idCardUrl: 'https://id.tuleva.ee',
};

export function initializeConfiguration() {
  if (process.env.NODE_ENV === 'development') {
    config.set(DEFAULT_CONF_DEV, { freeze: false });
  }

  if (process.env.NODE_ENV === 'production') {
    config.set(DEFAULT_CONF_PRODUCTION, { freeze: false });
  }

  if (process.env.REACT_APP_ENV === 'staging') {
    config.set(DEFAULT_CONF_STAGING, { freeze: false });
  }

  if (process.env.NODE_ENV === 'test') {
    config.set(DEFAULT_CONF_TEST, { freeze: false });
  }
}

export function updateLanguage(language) {
  if (process.env.NODE_ENV === 'development') {
    config.set({ ...DEFAULT_CONF_DEV, language }, { freeze: false });
  }

  if (process.env.NODE_ENV === 'production') {
    config.set({ ...DEFAULT_CONF_PRODUCTION, language }, { freeze: false });
  }

  if (process.env.REACT_APP_ENV === 'staging') {
    config.set({ ...DEFAULT_CONF_STAGING, language }, { freeze: false });
  }
}
