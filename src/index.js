import Raven from 'raven-js';
import React from 'react';
import { render } from 'react-dom';
import { createStore, combineReducers, compose, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { Provider as TranslationProvider } from 'retranslate';
import { Provider as ReduxProvider } from 'react-redux';
import { Router, Route, browserHistory } from 'react-router';
import { syncHistoryWithStore, routerReducer, routerMiddleware } from 'react-router-redux';

import translations from './translations';
import './index.scss';

import requireAuthentication from './requireAuthentication';
import LoginPage, { reducer as loginReducer, actions as loginActions } from './login';
import TermsOfUse from './termsOfUse';
import { reducer as exchangeReducer, actions as exchangeActions } from './exchange';
import App from './app';
import AccountPage from './account';
import Steps, {
  SelectSources,
  TransferFutureCapital,
  ConfirmMandate,
  Success,
} from './steps';

// Error tracking, public key.
if (process.env.NODE_ENV === 'production') {
  Raven
    .config('https://cfcb0c4bb8cb4264942f80ca1eb78c49@sentry.io/146907', {
      release: process.env.HEROKU_SLUG_COMMIT,
      environment: process.env.NODE_ENV,
    })
    .install();
  Raven.captureMessage('test event');
}

const rootReducer = combineReducers({
  routing: routerReducer,
  login: loginReducer,
  exchange: exchangeReducer, // exchage of funds
});

const composeEnhancers = (process.env.NODE_ENV === 'development' &&
  window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose; // eslint-disable-line

const routingMiddleware = routerMiddleware(browserHistory);

const store = createStore(rootReducer, composeEnhancers(applyMiddleware(thunk, routingMiddleware)));

const history = syncHistoryWithStore(browserHistory, store);

// TODO: figure out a place where to put these two
function getDataForApp() {
  const { login } = store.getState();
  if (login.token && !(login.user || login.loadingUser)) {
    store.dispatch(loginActions.getUser());
  }
}

function getDataForFlow() {
  const { login, exchange } = store.getState();
  if (login.token && !(exchange.sourceFunds || exchange.loadingSourceFunds ||
    exchange.targetFunds || exchange.loadingTargetFunds)) {
    store.dispatch(exchangeActions.getSourceFunds());
    store.dispatch(exchangeActions.getTargetFunds());
  }
}

function getDataForAccount() {
  const { login, exchange } = store.getState();
  if (login.token && !(exchange.sourceFunds || exchange.loadingSourceFunds)) {
    store.dispatch(exchangeActions.getSourceFunds());
  }
}

render((
  <TranslationProvider messages={translations} language="et" fallbackLanguage="et">
    <ReduxProvider store={store}>
      <Router history={history}>
        <Route path="/login" component={LoginPage} />
        <Route path="/terms-of-use" component={TermsOfUse} />
        <Route path="/" component={requireAuthentication(App)} onEnter={getDataForApp}>
          <Route path="/steps" component={Steps} onEnter={getDataForFlow}>
            <Route path="select-sources" component={SelectSources} />
            <Route path="transfer-future-capital" component={TransferFutureCapital} />
            <Route path="confirm-mandate" component={ConfirmMandate} />
          </Route>
          <Route path="/steps/success" component={Success} />
          <Route path="/account" component={AccountPage} onEnter={getDataForAccount} />
        </Route>
      </Router>
    </ReduxProvider>
  </TranslationProvider>
), document.getElementById('root'));
