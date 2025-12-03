import { createMemoryHistory, MemoryHistory } from 'history';
import { applyMiddleware, compose, createStore, Store } from 'redux';
import { Provider as ReduxProvider } from 'react-redux';
import configureMockStore, { MockStore } from 'redux-mock-store';
import thunk from 'redux-thunk';
import { ConnectedRouter, routerMiddleware } from 'connected-react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { act, render, RenderResult } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import translations from '../components/translations';
import { MOBILE_AUTHENTICATION_SUCCESS } from '../components/login/constants';
import createRootReducer from '../reducers';
import {
  AuthenticationManager,
  getAuthentication,
} from '../components/common/authenticationManager';
import { anAuthenticationManager } from '../components/common/authenticationManagerFixture';

export const mockStore = configureMockStore([thunk]);

export function renderWrapped(
  children: React.ReactNode,
  history = createMemoryHistory(),
  store = createDefaultStore(history as any),
): RenderResult {
  const wrapper = (component: React.ReactNode) => (
    <IntlProvider
      locale="en"
      messages={translations.en}
      defaultLocale="et"
      onError={(err) => {
        if (err.code === 'MISSING_TRANSLATION') {
          return;
        }
        throw err;
      }}
    >
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

export function createDefaultStore(history: History | MemoryHistory<unknown>): Store {
  return createStore(
    createRootReducer(history),
    compose(applyMiddleware(routerMiddleware(history as any), thunk)),
  );
}

export function createDefaultMockStore(
  history: MemoryHistory<unknown>,
  initialState = {},
): MockStore {
  const enhancedMiddlewares = [routerMiddleware(history)];
  const defaultMockStore = configureMockStore(enhancedMiddlewares);

  return defaultMockStore(initialState);
}
export function login(store: Store, method = 'SMART_ID'): void {
  const mockAuthenticationManager: AuthenticationManager = anAuthenticationManager();
  getAuthentication().update(mockAuthenticationManager);
  store.dispatch({
    type: MOBILE_AUTHENTICATION_SUCCESS,
    method,
  });
}

export const selectCountryOptionInTomSelect = (select: HTMLSelectElement, countryCode: string) => {
  // Get the TomSelect instance from the select element
  const tomSelectInstance = (select as any).tomselect;

  // Use TomSelect's API to add an item
  if (tomSelectInstance) {
    act(() => {
      tomSelectInstance.addItem(countryCode);
    });
  }
};
