import React, { Component, PropTypes as Types } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';

const tokenGranter = () => {

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
      }
    }

    render() {
      return (
        <div>
          {this.props.authenticated ? '' : ''}
        </div>
      );
    }
  }

  AuthenticatedComponent.propTypes = {
    authenticated: Types.bool.isRequired,
    redirectToLogin: Types.func.isRequired,
  };

  AuthenticatedComponent.displayName = `requireAuthentication(${getDisplayName(WrappedComponent)})`;

  const mapStateToProps = state => ({
    authenticated: !!state.login.token,
  });

  const mapDispatchToProps = dispatch => bindActionCreators({
    redirectToLogin: () => push('/login'),
  }, dispatch);

  const connectToRedux = connect(mapStateToProps, mapDispatchToProps);
  return connectToRedux(AuthenticatedComponent);
};

export default tokenGranter;
