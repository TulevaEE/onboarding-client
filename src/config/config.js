import config from 'react-global-configuration';

export default function initializeConfiguration() {
  console.log(process.env.NODE_ENV);
  if (process.env.NODE_ENV === 'development') {
    config.set({
      mixpanelKey: 'be355b17352ad6b4660ae595cd65ce61',
      applicationUrl: 'http://localhost:3000',
      newUserPaymentRedirectBaseUrl: 'https://payment-test.maksekeskus.ee/pay/1/link.html?shopId=322a5e5e-37ee-45b1-8961-ebd00e84e209&amount=100',
      clientCredentialsAccessToken: '6b338ba2-805c-4300-9341-b38bb4ad34a9',
    }, { freeze: false });
  } else {
    config.set({
      mixpanelKey: 'ff49493de3c6ed27e198e6b15063b60f',
      applicationUrl: 'https://pension.tuleva.ee',
      newUserPaymentRedirectBaseUrl: 'https://payment.maksekeskus.ee/pay/1/link.html?shopId=8c1a6c0a-2467-4166-ab47-006ddbf38b06&amount=100&return_url=https://onboarding-service.tuleva.ee/notifications/payments&return_method=POST&cancel_url=https://pension.tuleva.ee/steps/payment&cancel_method=GET&notification_url=https://onboarding-service.tuleva.ee/notifications/payments&notification_method=POST',
      clientCredentialsAccessToken: 'b4adb192-29a8-4861-a697-c704947d0023',
    }, { freeze: false });
  }
}
