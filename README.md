# :chart_with_upwards_trend: Onboarding client

1. Client for [Tuleva onboarding](https://pension.tuleva.ee)

[![CircleCI](https://circleci.com/gh/TulevaEE/onboarding-client/tree/master.svg?style=shield)](https://circleci.com/gh/TulevaEE/onboarding-client/tree/master)
[![codecov](https://codecov.io/gh/TulevaEE/onboarding-client/branch/master/graph/badge.svg)](https://codecov.io/gh/TulevaEE/onboarding-client)

## Tech evolution

Originally, this repo was built using js, redux and enzyme for testing. Over the years react has grown, rendering some of these technologies less useful. This architecture has shown itself to be overcomplicated and the current tests to not give as much value as they could. Thus, whenever you are working on new functionality in this repo, try to do the following:

- Convert files you touch to typescript, this can be easily done as typescript and js can be used interchangeably in this repo.
- Convert class components to functional if possible.
- Try to not use Redux (See below)
- Use react testing library and msw for tests and try to mock as little as possible, building tests to imitate how a user would use your application. See the [`CancellationFlow`](./src/components/flows/cancellation/CancellationFlow.tsx) for an example of how to incrementally move to this structure while reusing previous redux code.

### Migrating away from Redux 

* Prefer [React Query](https://react-query.tanstack.com/) hooks in new code
* Prefer [React's native context](https://react.dev/learn/passing-data-deeply-with-context) for localized state sharing, example in `withdrawals/hooks.ts`.

For old code:
1. Convert class components to functional to enable usage of hooks
2. Replace Redux logic based on `connect(Component)` with hooks. Prefer `react-query` hooks for data fetching. If needed, use [useSelector, useDispatch](https://react-redux.js.org/api/hooks) etc., to interact with Redux from a legacy functional component.
3. Abstract `useSelector` and `useDispatch` usage into separate hooks.

Then it's later possible to replace `useSelector` and `useDispatch` within those abstract hooks as the implementation evolves.


## Prerequisites

- Git
- Node.js LTS (20.14.0) and NPM (10.7.0)

Easiest way to get a specific version of Nodejs (or almost anything really) is to use [asdf](https://asdf-vm.com)
- *asdf plugin add nodejs*
- *asdf install nodejs*

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

## Updating Nodejs

We stay on the LTS version of Nodejs. When that changes, the version can be updated by:

- Updating the version in `package.json` *engines* property (set the upper limit to the next major version).
- Updating the version in `.circleci/config` tag *node/default* value to make the CI pipeline use the right version.
- Updating the version in `.tool-versions` (used by [asdf](https://asdf-vm.com))
