import React from 'react';
import { render } from 'react-dom';
import { createStore, combineReducers } from 'redux';
import { Provider as TranslationProvider } from 'retranslate';
import { Provider as ReduxProvider } from 'react-redux';
import { Router, Route, browserHistory } from 'react-router';
import { syncHistoryWithStore, routerReducer } from 'react-router-redux';

import translations from './translations';
import App from './App';
import './index.scss';

const store = createStore(combineReducers({ routing: routerReducer }));
const history = syncHistoryWithStore(browserHistory, store);

render((
  <TranslationProvider messages={translations} language="et" fallbackLanguage="et">
    <ReduxProvider store={store}>
      <Router history={history}>
        <Route path="/" component={App} />
      </Router>
    </ReduxProvider>
  </TranslationProvider>
), document.getElementById('root'));
