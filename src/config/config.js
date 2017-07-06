import config from 'react-global-configuration';

const DEFAULT_CONF_DEV = {
  mixpanelKey: 'be355b17352ad6b4660ae595cd65ce61',
  applicationUrl: 'http://localhost:3000',
  newUserPaymentRedirectBaseUrl: 'https://payment-test.maksekeskus.ee/pay/1/link.html?shopId=322a5e5e-37ee-45b1-8961-ebd00e84e209&amount=100',
  clientCredentialsAccessToken: '6b338ba2-805c-4300-9341-b38bb4ad34a9',
  language: 'et',
};

const DEFAULT_CONF_PRODUCTION = {
  mixpanelKey: 'ff49493de3c6ed27e198e6b15063b60f',
  applicationUrl: 'https://pension.tuleva.ee',
  newUserPaymentRedirectBaseUrl: 'https://payment.maksekeskus.ee/pay/1/link.html?shopId=8c1a6c0a-2467-4166-ab47-006ddbf38b06&amount=100&return_url=https://onboarding-service.tuleva.ee/notifications/payments&return_method=POST&cancel_url=https://pension.tuleva.ee/steps/payment&cancel_method=GET&notification_url=https://onboarding-service.tuleva.ee/notifications/payments&notification_method=POST',
  clientCredentialsAccessToken: '8275687a-4096-4b49-ac1d-b0feeadbc35e',
  language: 'et',
};

export function initializeConfiguration() {
  if (process.env.NODE_ENV === 'development') {
    config.set(DEFAULT_CONF_DEV, { freeze: false });
  }

  if (process.env.NODE_ENV === 'production') {
    config.set(DEFAULT_CONF_PRODUCTION, { freeze: false });
  }
}

export function updateLanguage(language) {
  if (process.env.NODE_ENV === 'development') {
    config.set({ ...DEFAULT_CONF_DEV, language }, { freeze: false });
  }

  if (process.env.NODE_ENV === 'production') {
    config.set({ ...DEFAULT_CONF_PRODUCTION, language }, { freeze: false });
  }
}
