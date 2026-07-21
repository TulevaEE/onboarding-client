import React from 'react';
import Types from 'prop-types';
import { Route, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { getAuthentication } from '../components/common/authenticationManager';

const LOGIN_PATH = '/login';

const ANALYTICS_ONLY_PARAMS = /^(utm_|gclid$|fbclid$)/;

const withoutAnalyticsParams = (search) => {
  const params = new URLSearchParams(search);
  Array.from(params.keys())
    .filter((key) => ANALYTICS_ONLY_PARAMS.test(key))
    .forEach((key) => params.delete(key));
  return params.toString() ? `?${params.toString()}` : '';
};

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
            search,
            state: { from: pathname + withoutAnalyticsParams(search) },
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

const mapStateToProps = () => ({
  isAuthenticated: !!getAuthentication().isAuthenticated(),
});

export default connect(mapStateToProps)(PrivateRoute);
