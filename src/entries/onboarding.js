import 'react-app-polyfill/ie11';
import React, { Component } from 'react';
import { render } from 'react-dom';
import config from 'react-global-configuration';
import { createBrowserHistory } from 'history';
import { createStore, compose, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { Provider as TranslationProvider } from 'retranslate';
import { Provider as ReduxProvider } from 'react-redux';
import { Switch, Route } from 'react-router-dom';
import { routerMiddleware, ConnectedRouter } from 'connected-react-router';
import mixpanel from 'mixpanel-browser';
import MixpanelProvider from 'react-mixpanel';
import GoogleAnalytics from 'react-ga';

import createRootReducer from './reducers';
import { getQueryParams } from './utils';
import { initializeConfiguration, updateLanguage } from './components/config/config';
import translations from './components/translations';
import './components/index.scss';

import PrivateRoute from './PrivateRoute';
import LoginPage, { actions as loginActions } from './components/login';
import TermsOfUse from './components/termsOfUse';
import { actions as thirdPillarActions } from './components/thirdPillar';

import './common/polyfills';
import LoggedInApp from './components/LoggedInApp';

const history = createBrowserHistory();

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({ trace: true, traceLimit: 25 }) || compose; // eslint-disable-line

const store = createStore(
  createRootReducer(history),
  composeEnhancers(applyMiddleware(routerMiddleware(history), thunk)),
);

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

  return language;
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

history.listen(() => {
  if (process.env.NODE_ENV === 'production') {
    GoogleAnalytics.pageview(window.location.href);
  }
});

class App extends Component {
  constructor(props) {
    applyRouting();
    super(props);
  }

  render() {
    return (
      <MixpanelProvider mixpanel={mixpanel}>
        <TranslationProvider
          messages={translations}
          language={applyLanguage()}
          fallbackLanguage="et"
        >
          <ReduxProvider store={store}>
            <ConnectedRouter history={history}>
              <Switch>
                <Route path="/login" component={LoginPage} />
                <Route path="/terms-of-use" component={TermsOfUse} />
                <PrivateRoute exact path="" component={LoggedInApp} />
              </Switch>
            </ConnectedRouter>
          </ReduxProvider>
        </TranslationProvider>
      </MixpanelProvider>
    );
  }
}

render(<App />, document.getElementById('root'));
