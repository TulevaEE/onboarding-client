import React, { Component } from 'react';
import { PropTypes as Types } from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { actions as loginActions } from '../login';

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

// higher order component which will redirect to login if tried to go to without auth.
const requireAuthentication = (WrappedComponent) => {
  class AuthenticatedComponent extends Component {
    componentWillMount() {
      this.checkAuthenticatedAndRedirect(this.props.authenticated);
    }

    componentWillReceiveProps(nextProps) {
      this.checkAuthenticatedAndRedirect(nextProps.authenticated);
    }

    checkAuthenticatedAndRedirect(authenticated) {
      if (!authenticated) {
        this.props.redirectToLogin();
        if (this.props.handleLoginCookies) { // FIXME: for testing purposes
          this.props.handleLoginCookies();
        }
      }
    }

    render() {
      return (
        <div>
          {this.props.authenticated ? <WrappedComponent {...this.props} /> : ''}
        </div>
      );
    }
  }

  AuthenticatedComponent.propTypes = {
    authenticated: Types.bool.isRequired,
    redirectToLogin: Types.func.isRequired,
    handleLoginCookies: Types.func.isRequired,
  };

  AuthenticatedComponent.displayName = `requireAuthentication(${getDisplayName(WrappedComponent)})`;

  const mapStateToProps = state => ({
    authenticated: !!state.login.token,
  });

  const mapDispatchToProps = dispatch => bindActionCreators({
    redirectToLogin: () => push('/login'),
    handleLoginCookies: loginActions.handleLoginCookies,
  }, dispatch);

  const connectToRedux = connect(mapStateToProps, mapDispatchToProps);
  return connectToRedux(AuthenticatedComponent);
};

export default requireAuthentication;
