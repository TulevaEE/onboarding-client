import React from 'react';
import { render } from 'react-dom';
import { createStore, combineReducers, compose, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { Provider as TranslationProvider } from 'retranslate';
import { Provider as ReduxProvider } from 'react-redux';
import mixpanel from 'mixpanel-browser';
import MixpanelProvider from 'react-mixpanel';

import translations from './components/translations';
import './components/inline-login-index.css';

import './common/polyfills';
import { reducer as loginReducer } from './components/login';
import InlineLoginPage from './components/login/inlineLogin/inlineLoginPage';
import { initializeConfiguration } from './components/config/config';

const rootReducer = combineReducers({
  login: loginReducer,
});

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose; // eslint-disable-line
const store = createStore(rootReducer, composeEnhancers(applyMiddleware(thunk)));

function getLanguage() {
  const params = window.location.search;

  if (params.indexOf('language=et') >= 0) {
    return 'et';
  } else if (params.indexOf('language=en') >= 0) {
    return 'en';
  }
  return 'et';
}

initializeConfiguration();

render(
  <MixpanelProvider mixpanel={mixpanel}>
    <TranslationProvider messages={translations} language={getLanguage()} fallbackLanguage="et">
      <ReduxProvider store={store}>
        <InlineLoginPage />
      </ReduxProvider>
    </TranslationProvider>
  </MixpanelProvider>,
  document.getElementById('inline-login'),
);
