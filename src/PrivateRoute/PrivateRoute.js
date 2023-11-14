import React from 'react';
import Types from 'prop-types';
import { Route, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';

const LOGIN_PATH = '/login';

const PrivateRoute = ({ component: Component, isAuthenticated, ...otherPrivateRouteProps }) => (
  <Route
    {...otherPrivateRouteProps}
    render={({ location: { pathname, search } }) =>
      isAuthenticated ? (
        <Component />
      ) : (
        <Redirect
          to={{
            pathname: LOGIN_PATH,
            state: { from: pathname + search },
          }}
        />
      )
    }
  />
);

PrivateRoute.propTypes = {
  component: Types.func,
  isAuthenticated: Types.bool,
};

PrivateRoute.defaultProps = {
  component: () => {},
  isAuthenticated: false,
};

const mapStateToProps = (state) => ({
  isAuthenticated: !!state.login.token,
});

export default connect(mapStateToProps)(PrivateRoute);
