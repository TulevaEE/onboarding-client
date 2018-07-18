# :chart_with_upwards_trend: Onboarding client

1. Client for [Tuleva onboarding](https://pension.tuleva.ee)
1. Inline signup widget (used [here](https://tuleva.ee/tulundusyhistu/#inline-signup-anchor))
1. Inline login widget (used [here](https://tuleva.ee/liikme-kinnitus))

[![CircleCI](https://circleci.com/gh/TulevaEE/onboarding-client/tree/master.svg?style=shield)](https://circleci.com/gh/TulevaEE/onboarding-client/tree/master)

## Development

To develop the onboarding app:

1. Install dependencies
```
npm install
```
2. Run the local server
```
npm run develop
```
3. Run tests
```
npm test
```

[`onboarding-service`](https://github.com/TulevaEE/onboarding-service) is expected to run on port 9000.

### Deployment

Updating the inline widget is manual, so the bundles need to be created locally, uploaded to the Zone FTP server, and the URLs in [`wordpress-theme`](https://github.com/TulevaEE/wordpress-theme) updated.

The onboarding client itself is deployed to Heroku on `master` push (through [CircleCI](https://circleci.com/gh/TulevaEE/onboarding-client)). The server then builds the static files using Webpack and starts a content server (`server.js`) serving those files and proxying the API.