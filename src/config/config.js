import config from 'react-global-configuration';

export default function initializeConfiguration() {
  if (process.env.NODE_ENV === 'development') {
    config.set({
      mixpanelKey: 'be355b17352ad6b4660ae595cd65ce61',
      applicationUrl: 'http://localhost:3000',
    });
  }

  if (process.env.NODE_ENV === 'production') {
    config.set({
      mixpanelKey: 'ff49493de3c6ed27e198e6b15063b60f',
      applicationUrl: 'https://pension.tuleva.ee',
    });
  }
}
