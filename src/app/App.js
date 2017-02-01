import React, { PropTypes as Types } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { actions } from '../login';
import Header from './header';

export const App = ({ children, user, loadingUser, onLogout }) => (
  <div className="container mt-4">
    <div className="row justify-content-center">
      <div className="col-lg-10">
        <Header user={user} loading={loadingUser} onLogout={onLogout} />
        {children}
      </div>
    </div>
  </div>
);

const noop = () => null;

App.defaultProps = {
  children: null,
  user: null,
  loadingUser: false,
  onLogout: noop,
};

App.propTypes = {
  children: Types.oneOfType([Types.node, Types.arrayOf(Types.node)]),
  user: Types.shape({ name: Types.string, personalCode: Types.string }),
  loadingUser: Types.bool,
  onLogout: Types.func,
};

const mapStateToProps = state => ({
  user: {
    name: `${(state.login.user || {}).firstName} ${(state.login.user || {}).lastName}`,
    personalCode: (state.login.user || {}).personalCode,
  },
  loadingUser: state.login.loadingUser,
});

const mapDispatchToProps = dispatch => bindActionCreators({
  onLogout: actions.logOut,
}, dispatch);

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(App);
