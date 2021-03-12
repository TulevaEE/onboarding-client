# :chart_with_upwards_trend: Onboarding client

1. Client for [Tuleva onboarding](https://pension.tuleva.ee)
1. Inline signup widget (used [here](https://tuleva.ee/tulundusyhistu/#inline-signup-anchor))
1. Inline login widget (used [here](https://tuleva.ee/liikme-kinnitus))

[![CircleCI](https://circleci.com/gh/TulevaEE/onboarding-client/tree/master.svg?style=shield)](https://circleci.com/gh/TulevaEE/onboarding-client/tree/master)
[![codecov](https://codecov.io/gh/TulevaEE/onboarding-client/branch/master/graph/badge.svg)](https://codecov.io/gh/TulevaEE/onboarding-client)

## Tech evolution

Originally, this repo was built using js, redux and enzyme for testing. Over the years react has grown, rendering some of these tehcnologies less useful. This architecture has shown itself to be overcomplicated and the current tests to not give as much value as they could. Thus, whenever you are working on new functionality in this repo, try to do the following:

- Convert files you touch to typescript, this can be easily done as typescript and js can be used interchangably in this repo
- Try to not use redux, or if you need to use it try to keep it far away from your code in a generic hook, use simple hooks for logic and [React Query](https://react-query.tanstack.com/) for async data fetching boilerplate
- Use react testing library and msw for tests and try to mock as little as possible, building tests to imitate how a user would use your application. See the `src/flows/CancellationFlow` for an example of how to incrementally move to this structure while reusing previous redux code.

## Prerequisites

- Git
- Node.js and NPM

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

Or alternatively, when running against production, switch the `proxy` field in `package.json` against the production server, and run:

```
npm run develop-production
```

3. Run tests

```
npm test
```

[`onboarding-service`](https://github.com/TulevaEE/onboarding-service) is expected to run on port 9000 when not running against production.

### Development against the production service (https://onboarding-service.tuleva.ee)

1. Point the proxy server to production in `package.json`: `"proxy": "https://onboarding-service.tuleva.ee"`
1. `npm run develop-production`
1. If chrome won't open the page due to a certificate error, type: `thisisunsafe`

### Deployment

Updating the inline widget is manual, so the bundles need to be created locally, uploaded to the Zone FTP server, and the URLs in [`wordpress-theme`](https://github.com/TulevaEE/wordpress-theme) updated.

The onboarding client itself is deployed to AWS on `master` push (through [CircleCI](https://circleci.com/gh/TulevaEE/onboarding-client)).
