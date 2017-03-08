import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

export const AccountPage = () => (
  <div className="row">
    <div className="col">
      <h1>I will become the account page.</h1>
    </div>
  </div>
);

// TODO: write component
const mapStateToProps = state => state;
const mapDispatchToProps = dispatch => bindActionCreators({}, dispatch);

const withRedux = connect(mapStateToProps, mapDispatchToProps);

export default withRedux(AccountPage);
