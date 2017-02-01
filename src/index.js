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
import { reducer as exchangeReducer } from './exchange';
import App from './app';
import Steps, {
  SelectExchange,
  SelectFund,
  TransferFutureCapital,
  ConfirmApplication,
} from './steps';

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

// TODO: figure out a place where to put this
function getUserIfNecessary() {
  const { login } = store.getState();
  if (login.token && !(login.user || login.loadingUser)) {
    store.dispatch(loginActions.getUser());
  }
}

render((
  <TranslationProvider messages={translations} language="et" fallbackLanguage="et">
    <ReduxProvider store={store}>
      <Router history={history}>
        <Route path="/login" component={LoginPage} />
        <Route path="/" component={requireAuthentication(App)} onEnter={getUserIfNecessary}>
          <Route path="/steps" component={Steps}>
            <Route path="select-exchange" component={SelectExchange} />
            <Route path="select-fund" component={SelectFund} />
            <Route path="transfer-future-capital" component={TransferFutureCapital} />
            <Route path="confirm-application" component={ConfirmApplication} />
          </Route>
        </Route>
      </Router>
    </ReduxProvider>
  </TranslationProvider>
), document.getElementById('root'));
