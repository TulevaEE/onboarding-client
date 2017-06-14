import React from 'react';
import { render } from 'react-dom';
import { createStore, combineReducers, compose } from 'redux';
import { Provider as TranslationProvider } from 'retranslate';
import { Provider as ReduxProvider } from 'react-redux';
import mixpanel from 'mixpanel-browser';
import MixpanelProvider from 'react-mixpanel';

import translations from '../src/translations';
import '../src/index.scss';

import { reducer as loginReducer } from '../src/login';
import InlineLoginPage from '../src/login/inlineLogin/inlineLoginPage';

const rootReducer = combineReducers({
  login: loginReducer,
});

const composeEnhancers = (window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose; // eslint-disable-line

const store = createStore(rootReducer);

function getLanguage() {
  const params = window.location.search;

  if (params.indexOf('language=et') >= 0) {
    return 'et';
  } else if (params.indexOf('language=en') >= 0) {
    return 'en';
  }
  return 'et';
}


render((
  <MixpanelProvider mixpanel={mixpanel}>
    <TranslationProvider
      messages={translations} language={getLanguage()} fallbackLanguage="et"
    >
      <ReduxProvider store={store}>
        <InlineLoginPage />
      </ReduxProvider>
    </TranslationProvider>
  </MixpanelProvider>
), document.getElementById('root'));
