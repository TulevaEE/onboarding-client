import { createMemoryHistory } from 'history';
import { applyMiddleware, compose, createStore, Store } from 'redux';
import { Provider as ReduxProvider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { ConnectedRouter, routerMiddleware } from 'connected-react-router';
import { QueryClient, QueryClientProvider } from 'react-query';
import React from 'react';
import { render, RenderResult } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import translations from '../components/translations';
import { MOBILE_AUTHENTICATION_SUCCESS } from '../components/login/constants';
import createRootReducer from '../reducers';

export const mockStore = configureMockStore([thunk]);

export function renderWrapped(
  children: React.ReactNode,
  history = createMemoryHistory(),
  store = createDefaultStore(history as any),
): RenderResult {
  const wrapper = (component: React.ReactNode) => (
    <IntlProvider locale="en" messages={translations.en} defaultLocale="et">
      <ReduxProvider store={store}>
        <QueryClientProvider client={new QueryClient()}>
          <ConnectedRouter history={history}>{component}</ConnectedRouter>
        </QueryClientProvider>
      </ReduxProvider>
    </IntlProvider>
  );
  const view = render(wrapper(children));
  const rerender = (component: React.ReactNode) => view.rerender(wrapper(component));
  return { ...view, rerender };
}

export function createDefaultStore(history: History): Store {
  return createStore(
    createRootReducer(history),
    compose(applyMiddleware(routerMiddleware(history as any), thunk)),
  );
}

export function login(store: Store, method = 'smartId', token = 'mock token'): void {
  store.dispatch({
    type: MOBILE_AUTHENTICATION_SUCCESS,
    tokens: {
      accessToken: token,
    },
    method,
  });
}
