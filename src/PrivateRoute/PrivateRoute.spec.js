import React from 'react';
import { render, screen } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import { Route, Router, Switch } from 'react-router-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import PrivateRoute from '.';

jest.mock('../components/common/authenticationManager', () => ({
  getAuthentication: () => ({ isAuthenticated: () => false }),
}));

it('carries the full destination, query included, through the login redirect', () => {
  // A shared link like /calculator?return=7 must survive the login wall: the
  // login page later redirects to state.from verbatim.
  const history = createMemoryHistory({ initialEntries: ['/calculator?return=7'] });

  render(
    <Provider store={createStore(() => ({}))}>
      <Router history={history}>
        <Switch>
          <Route
            path="/login"
            render={({ location }) => <div data-testid="from">{location.state?.from}</div>}
          />
          <PrivateRoute exact path="" component={() => null} />
        </Switch>
      </Router>
    </Provider>,
  );

  expect(history.location.pathname).toBe('/login');
  expect(history.location.search).toBe('?return=7');
  expect(screen.getByTestId('from')).toHaveTextContent('/calculator?return=7');
});
