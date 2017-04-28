Onboarding client
=================

Client for Tuleva onboarding.

[![CircleCI](https://circleci.com/gh/TulevaEE/onboarding-client/tree/master.svg?style=shield)](https://circleci.com/gh/TulevaEE/onboarding-client/tree/master)

## Stack

It's built using the `react` and `redux` stack. It's tested using `jest`. All routing happens on the client side, using `react-router`. Bindings between the router and redux are handled with `react-router-redux`. All strings in the application
are defined in translation files and consumed using `retranslate`.

## Development

Use `yarn` or `npm install` to install dependencies. Then use `yarn develop` or `npm run develop` to run the local test environment. It expects `onboarding-service` to be running on port 9000. To run tests, use `yarn test` or `npm test`. On the live environment, requests to the api are routed through the proxy running in the static server.

### Production and deployment

In production, the files are built using webpack and served using a tiny content server (`scripts/start.js`). When a branch is merged to master, CircleCI builds and runs tests. When tests pass, deployment is done automatically on Heroku.
