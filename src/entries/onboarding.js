import 'react-app-polyfill/ie11';
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

import { getQueryParams } from './utils';
import { initializeConfiguration, updateLanguage } from './components/config/config';
import translations from './components/translations';
import './components/index.scss';

import requireAuthentication from './components/requireAuthentication';
import LoginPage, { reducer as loginReducer, actions as loginActions } from './components/login';
import TermsOfUse from './components/termsOfUse';
import NonMember from './components/newUserFlow/nonMember';
import { reducer as exchangeReducer, actions as exchangeActions } from './components/exchange';
import {
  reducer as thirdPillarReducer,
  actions as thirdPillarActions,
} from './components/thirdPillar';
import trackingReducer from './components/tracking';
import { actions as routerActions } from './components/router';

import './common/polyfills';
import LoggedInApp from './components/app';
import AccountPage, {
  reducer as accountReducer,
  actions as accountActions,
} from './components/account';
import {
  actions as returnComparisonActions,
  reducer as returnComparisonReducer,
} from './components/returnComparison';
import SecondPillarFlow, {
  SelectSources,
  TransferFutureCapital,
  ConfirmMandate,
  Success,
} from './components/flows/secondPillar';
import { unregister as unregisterServiceWorker } from './common/registerServiceWorker';

const rootReducer = combineReducers({
  routing: routingReducer,
  login: loginReducer,
  exchange: exchangeReducer, // exchage of funds
  account: accountReducer,
  returnComparison: returnComparisonReducer,
  thirdPillar: thirdPillarReducer,
  tracking: trackingReducer,
  form: formReducer,
});

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose; // eslint-disable-line

const routingMiddleware = routerMiddleware(browserHistory);

const store = createStore(rootReducer, composeEnhancers(applyMiddleware(thunk, routingMiddleware)));

const history = syncHistoryWithStore(browserHistory, store);

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

async function getUserAndConversionData() {
  const { login } = store.getState();

  if (login.userConversionError || login.userError) {
    store.dispatch(loginActions.logOut());
  } else if (
    login.token &&
    (!(login.user || login.loadingUser) || !(login.userConversion || login.loadingUserConversion))
  ) {
    await Promise.all([
      store.dispatch(loginActions.getUserConversion()),
      store.dispatch(loginActions.getUser()),
    ]);
    await getSourceAndTargetFundsData();
    await store.dispatch(routerActions.selectRouteForState());
  }
  return Promise.resolve();
}

function applyRouting() {
  const queryParams = getQueryParams();
  store.dispatch(loginActions.handleIdCardLogin(queryParams));
  store.dispatch(thirdPillarActions.addDataFromQueryParams(queryParams));
}

function getDataForApp() {
  applyRouting();
  return getUserAndConversionData();
}

async function initApp(nextState, replace, callback) {
  await getDataForApp();
  callback();
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

function getReturnComparisonData() {
  const {
    login,
    returnComparison: { loading, actualPercentage },
  } = store.getState();
  if (login.token && !(actualPercentage !== null || loading)) {
    store.dispatch(returnComparisonActions.getReturnComparisonForStartDate(null));
  }
}

function getDataForAccount() {
  getSourceAndTargetFundsData();
  getInitialCapitalData();
  getPendingExchangesData();
  getReturnComparisonData();
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

const secondPillarFlowSteps = [
  { path: 'select-sources', component: SelectSources },
  { path: 'transfer-future-capital', component: TransferFutureCapital },
  { path: 'confirm-mandate', component: ConfirmMandate },
];

const App = () => (
  <MixpanelProvider mixpanel={mixpanel}>
    <TranslationProvider messages={translations} language={applyLanguage()} fallbackLanguage="et">
      <ReduxProvider store={store}>
        <Router onUpdate={trackPageView} history={history}>
          <Fragment>
            <Route path="/login" component={LoginPage} />
            <Route path="/terms-of-use" component={TermsOfUse} />
            <Route path="/" component={requireAuthentication(LoggedInApp)} onEnter={initApp}>
              <Route path="/2nd-pillar-flow">
                <Route path="non-member" component={NonMember} />
              </Route>

              <Route path="2nd-pillar-flow" component={SecondPillarFlow}>
                {secondPillarFlowSteps.map(({ path, component }) => (
                  <Route path={path} component={component} onEnter={scrollToTop} />
                ))}
              </Route>
              <Route path="/2nd-pillar-flow/success" component={Success} />
              <Route path="/account" component={AccountPage} onEnter={getDataForAccount} />
            </Route>
          </Fragment>
        </Router>
      </ReduxProvider>
    </TranslationProvider>
  </MixpanelProvider>
);

render(<App />, document.getElementById('root'));

unregisterServiceWorker();
