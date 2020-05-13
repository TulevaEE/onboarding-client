import 'react-app-polyfill/ie11';
import React from 'react';
import { render } from 'react-dom';
import { createStore, combineReducers, compose, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { Provider as TranslationProvider } from 'retranslate';
import { Provider as ReduxProvider } from 'react-redux';
import mixpanel from 'mixpanel-browser';
import MixpanelProvider from 'react-mixpanel';
import { reducer as formReducer } from 'redux-form';

import translations from './components/translations';
import './components/inline-login-index.scss';

import './common/polyfills';
import { reducer as loginReducer } from './components/login';
import { reducer as accountReducer } from './components/account';
import { reducer as contactDetailReducer } from './components/contact-details';
import InlineSignUp from './components/newUserFlow/inlineSignUp';
import { initializeConfiguration } from './components/config/config';

const rootReducer = combineReducers({
  login: loginReducer,
  account: accountReducer,
  contactDetail: contactDetailReducer,
  form: formReducer,
});

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose; // eslint-disable-line
const store = createStore(rootReducer, composeEnhancers(applyMiddleware(thunk)));

function getLanguage() {
  const params = window.location.search;

  if (params.indexOf('language=et') >= 0) {
    return 'et';
  }
  if (params.indexOf('language=en') >= 0) {
    return 'en';
  }
  return 'et';
}

initializeConfiguration();

render(
  <MixpanelProvider mixpanel={mixpanel}>
    <TranslationProvider messages={translations} language={getLanguage()} fallbackLanguage="et">
      <ReduxProvider store={store}>
        <InlineSignUp />
      </ReduxProvider>
    </TranslationProvider>
  </MixpanelProvider>,
  document.getElementById('inline-signup'),
);
