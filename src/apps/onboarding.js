import React, { Fragment } from 'react';
import { render } from 'react-dom';
import config from 'react-global-configuration';
import { createStore, combineReducers, compose, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { reducer as formReducer } from 'redux-form';
import { Provider as TranslationProvider } from 'retranslate';
import { Provider as ReduxProvider } from 'react-redux';
import { Router, Route, browserHistory } from 'react-router';
import {
  routerReducer as routingReducer,
  routerMiddleware,
  syncHistoryWithStore,
} from 'react-router-redux';
import mixpanel from 'mixpanel-browser';
import MixpanelProvider from 'react-mixpanel';
import GoogleAnalytics from 'react-ga';

import { initializeConfiguration, updateLanguage } from '../config/config';
import translations from '../translations';
import '../index.css';

import requireAuthentication from '../requireAuthentication';
import LoginPage, { reducer as loginReducer, actions as loginActions } from '../login';
import TermsOfUse from '../termsOfUse';
import NonMember from '../newUserFlow/nonMember';
import { reducer as exchangeReducer, actions as exchangeActions } from '../exchange';
import trackingReducer from '../tracking';
import { reducer as comparisonReducer } from '../comparison';
import { reducer as quizReducer, actions as quizActions } from '../quiz';
import { reducer as routerReducer, router } from '../router';
import Quiz from '../quiz/Quiz';
import { refreshToken } from '../login/actions';

import App from '../app';
import AccountPage, { reducer as accountReducer, actions as accountActions } from '../account';
import Steps, {
  SelectSources,
  TransferFutureCapital,
  ConfirmMandate,
  Success,
} from '../onboardingFlow';

const rootReducer = combineReducers({
  routing: routingReducer,
  login: loginReducer,
  exchange: exchangeReducer, // exchage of funds
  comparison: comparisonReducer,
  account: accountReducer,
  tracking: trackingReducer,
  form: formReducer,
  quiz: quizReducer,
  router: routerReducer,
});

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose; // eslint-disable-line

const routingMiddleware = routerMiddleware(browserHistory);

const store = createStore(rootReducer, composeEnhancers(applyMiddleware(thunk, routingMiddleware)));

const history = syncHistoryWithStore(browserHistory, store);

function refreshTokenIfNeeded(query) {
  if (query.isNewMember === 'true') {
    return store.dispatch(refreshToken());
  }
  return Promise.resolve();
}

function getSourceAndTargetFundsData() {
  const { login, exchange } = store.getState();
  if (
    login.token &&
    !(
      exchange.sourceFunds ||
      exchange.loadingSourceFunds ||
      exchange.targetFunds ||
      exchange.loadingTargetFunds
    )
  ) {
    store.dispatch(exchangeActions.getSourceFunds());
    store.dispatch(exchangeActions.getTargetFunds());
  }
}

function getUserAndConversionData(nextState) {
  const { login } = store.getState();
  if (
    login.token &&
    (!(login.user || login.loadingUser) || !(login.userConversion || login.loadingUserConversion))
  ) {
    return refreshTokenIfNeeded(nextState.location.query).then(() =>
      Promise.all([
        store.dispatch(loginActions.getUserConversion()),
        store.dispatch(loginActions.getUser()),
      ]).then(() => {
        getSourceAndTargetFundsData();
        store.dispatch(router.selectRouteForState());
      }),
    );
  }
  return Promise.resolve();
}

function applyRouting(nextState) {
  store.dispatch(loginActions.mapUrlQueryParamsToState(nextState.location.query));
  store.dispatch(loginActions.handleIdCardLogin(nextState.location.query));
  store.dispatch(exchangeActions.mapUrlQueryParamsToState(nextState.location.query));
  if (quizActions.isRouteToQuiz(nextState.location)) {
    store.dispatch(quizActions.routeToQuiz());
  }
  if (router.isRouteToAccount(nextState.location)) {
    store.dispatch(router.routeToAccount());
  }
}

function getDataForApp(nextState) {
  applyRouting(nextState);
  return getUserAndConversionData(nextState);
}

function initApp(nextState, replace, callback) {
  getDataForApp(nextState).then(() => callback());
}

function getInitialCapitalData() {
  const { login, account } = store.getState();
  if (
    login.token &&
    login.user &&
    login.user.memberNumber &&
    !(account.initialCapital || account.loadingInitialCapital)
  ) {
    store.dispatch(accountActions.getInitialCapital());
  }
}

function getPendingExchangesData() {
  const { login, exchange } = store.getState();
  if (login.token && !(exchange.pendingExchanges || exchange.loadingPendingExchanges)) {
    store.dispatch(exchangeActions.getPendingExchanges());
  }
}

function getDataForAccount() {
  getSourceAndTargetFundsData();
  getInitialCapitalData();
  getPendingExchangesData();
}

function applyLanguage() {
  const params = window.location.search;

  let language = 'et';
  if (params.indexOf('language=et') >= 0) {
    language = 'et';
  } else if (params.indexOf('language=en') >= 0) {
    language = 'en';
  }
  updateLanguage(language);

  return language;
}

function scrollToTop() {
  window.scrollTo(0, 0);
}

initializeConfiguration();

window.config = config; // for debug only

mixpanel.init(config.get('mixpanelKey'));

GoogleAnalytics.initialize('UA-76855836-1', {
  debug: false,
  titleCase: false,
  gaOptions: {
    alwaysSendReferrer: true,
  },
});

function trackPageView() {
  if (process.env.NODE_ENV === 'production') {
    GoogleAnalytics.pageview(window.location.href);
  }
}

render(
  <MixpanelProvider mixpanel={mixpanel}>
    <TranslationProvider messages={translations} language={applyLanguage()} fallbackLanguage="et">
      <ReduxProvider store={store}>
        <Router onUpdate={trackPageView} history={history}>
          <Fragment>
            <Route path="/login" component={LoginPage} />
            <Route path="/terms-of-use" component={TermsOfUse} />
            <Route path="/" component={requireAuthentication(App)} onEnter={initApp}>
              <Route path="/quiz" component={Quiz} />

              <Route path="/steps">
                <Route path="non-member" component={NonMember} />
              </Route>

              <Route path="steps" component={Steps}>
                <Route path="select-sources" component={SelectSources} onEnter={scrollToTop} />
                <Route
                  path="transfer-future-capital"
                  component={TransferFutureCapital}
                  onEnter={scrollToTop}
                />
                <Route path="confirm-mandate" component={ConfirmMandate} onEnter={scrollToTop} />
              </Route>
              <Route path="/steps/success" component={Success} />
              <Route path="/account" component={AccountPage} onEnter={getDataForAccount} />
            </Route>
          </Fragment>
        </Router>
      </ReduxProvider>
    </TranslationProvider>
  </MixpanelProvider>,
  document.getElementById('root'),
);
