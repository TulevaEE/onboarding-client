import React, { PureComponent } from 'react';
import { PropTypes as Types } from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { actions } from '../login';
import Header from './header';
import Footer from './footer';

export class LoggedInApp extends PureComponent {
  render() {
    const { user, loading, onLogout, children } = this.props;

    return (
      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <Header user={user} loading={loading} onLogout={onLogout} />
            {children}
            <Footer />
          </div>
        </div>
      </div>
    );
  }
}

const noop = () => null;

LoggedInApp.defaultProps = {
  children: null,
  user: null,
  loading: false,
  onLogout: noop,
};

LoggedInApp.propTypes = {
  children: Types.oneOfType([Types.node, Types.arrayOf(Types.node)]),
  user: Types.shape({ name: Types.string }),
  loading: Types.bool,
  onLogout: Types.func,
};

const mapStateToProps = state => ({
  user: {
    name: `${(state.login.user || {}).firstName} ${(state.login.user || {}).lastName}`,
  },
  loading: state.login.loadingUser || state.login.loadingUserConversion,
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      onLogout: actions.logOut,
    },
    dispatch,
  );

const connectToRedux = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default connectToRedux(LoggedInApp);
