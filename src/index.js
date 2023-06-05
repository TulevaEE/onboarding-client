import 'react-app-polyfill/ie11';
import React, { Component } from 'react';
import { render } from 'react-dom';
import config from 'react-global-configuration';
import { createBrowserHistory } from 'history';
import { applyMiddleware, compose, createStore } from 'redux';
import thunk from 'redux-thunk';
import { IntlProvider } from 'react-intl';
import { Provider as ReduxProvider } from 'react-redux';
import { Route, Switch } from 'react-router-dom';
import { ConnectedRouter, routerMiddleware } from 'connected-react-router';
import ReactGA from 'react-ga4';
import { QueryClient, QueryClientProvider } from 'react-query';
import moment from 'moment';
import 'moment/locale/et';

import createRootReducer from './reducers';
import { getQueryParams } from './utils';
import { initializeConfiguration, updateLanguage } from './components/config/config';
import translations from './components/translations';
import './components/index.scss';

import PrivateRoute from './PrivateRoute';
import LoginPage, { actions as loginActions } from './components/login';
import { actions as thirdPillarActions } from './components/thirdPillar';

import './polyfills';
import LoggedInApp from './components/LoggedInApp';
import { loginPath } from './components/login/LoginPage';

const history = createBrowserHistory();

const composeEnhancers =
  (window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ &&
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
      trace: true,
      traceLimit: 25,
    })) ||
  compose; // eslint-disable-line

const store = createStore(
  createRootReducer(history),
  composeEnhancers(applyMiddleware(routerMiddleware(history), thunk)),
);

const queryClient = new QueryClient();

function applyRouting() {
  const queryParams = getQueryParams();
  store.dispatch(loginActions.handleIdCardLogin(queryParams));
  store.dispatch(thirdPillarActions.addDataFromQueryParams(queryParams));
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
  moment.locale(language);

  return language;
}

initializeConfiguration();

window.config = config; // for debug only

if (process.env.NODE_ENV !== 'test') {
  ReactGA.initialize('288772633', {
    debug: false,
    titleCase: false,
    gaOptions: {
      alwaysSendReferrer: true,
    },
  });
}

export class App extends Component {
  constructor(props) {
    applyRouting();
    super(props);
  }

  render() {
    const locale = applyLanguage();

    return (
      <QueryClientProvider client={queryClient}>
        <IntlProvider messages={translations[locale]} locale={locale} defaultLocale="et">
          <ReduxProvider store={store}>
            <ConnectedRouter history={history}>
              <Switch>
                <Route path={loginPath} component={LoginPage} />
                <PrivateRoute exact path="" component={LoggedInApp} />
              </Switch>
            </ConnectedRouter>
          </ReduxProvider>
        </IntlProvider>
      </QueryClientProvider>
    );
  }
}

render(<App />, document.getElementById('root'));
