import React from 'react';
import { render } from 'react-dom';
import { createStore, combineReducers } from 'redux';
import { Provider as TranslationProvider } from 'retranslate';
import { Provider as ReduxProvider } from 'react-redux';
import { Router, Route, browserHistory } from 'react-router';
import { syncHistoryWithStore, routerReducer } from 'react-router-redux';

import translations from './translations';
import LoginPage, { reducer as loginReducer } from './login';
import './index.scss';

const rootReducer = combineReducers({
  routing: routerReducer,
  login: loginReducer,
});

const store = createStore(
  rootReducer,
  process.env.NODE_ENV === 'development' &&
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(), // eslint-disable-line
);

const history = syncHistoryWithStore(browserHistory, store);

render((
  <TranslationProvider messages={translations} language="et" fallbackLanguage="et">
    <ReduxProvider store={store}>
      <Router history={history}>
        <Route path="/login" component={LoginPage} />
      </Router>
    </ReduxProvider>
  </TranslationProvider>
), document.getElementById('root'));
