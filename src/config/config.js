import config from 'react-global-configuration';

export default function initializeConfiguration() {
  if (process.env.NODE_ENV === 'development') {
    config.set({
      mixpanelKey: 'be355b17352ad6b4660ae595cd65ce61',
      applicationUrl: 'http://localhost:3000',
      newUserPaymentRedirectBaseUrl: 'https://payment-test.maksekeskus.ee/pay/1/link.html?shopId=322a5e5e-37ee-45b1-8961-ebd00e84e209',
    }, { freeze: false });
  }

  if (process.env.NODE_ENV === 'production') {
    config.set({
      mixpanelKey: 'ff49493de3c6ed27e198e6b15063b60f',
      applicationUrl: 'https://pension.tuleva.ee',
      newUserPaymentRedirectBaseUrl: 'https://payment.maksekeskus.ee/pay/1/link.html?shopId=8c1a6c0a-2467-4166-ab47-006ddbf38b06',
    }, { freeze: false });
  }
}
