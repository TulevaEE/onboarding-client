import React from 'react';
// import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { screen, act } from '@testing-library/react';
import { Route, Switch } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';

import { createDefaultStore, renderWrapped } from '../../test/utils';
import { initializeConfiguration } from '../config/config';
import { LoginPage, loginPath } from './LoginPage';

jest.unmock('retranslate');
// TODO: finish these
describe('When a user is logging in', () => {
  const server = setupServer();
  let history: History;

  function render() {
    history = createMemoryHistory();
    const store = createDefaultStore(history as any);

    renderWrapped(
      <Switch>
        <Route path="/account" render={() => <h1>Mock account page</h1>} />
        <Route path={loginPath} component={LoginPage} />
      </Switch>,
      history as any,
      store,
    );
  }
  beforeEach(() => {
    initializeConfiguration();
    render();
    act(() => {
      history.push('/login');
    });
  });
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  test('they can sign in with smart id, showing the security code', async () => {
    expect(await screen.findByText('Log in')).toBeInTheDocument();
  });
});
