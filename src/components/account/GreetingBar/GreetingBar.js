import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Shimmer } from '../../common/shimmer/Shimmer';
import { getFullName } from '../../common/utils';

export class GreetingBar extends Component {
  componentDidMount() {}

  render() {
    const { user } = this.props;
    if (!user) {
      return (
        <div>
          <Shimmer height={38} />
        </div>
      );
    }
    return (
      <div className="d-flex flex-column flex-md-row align-items-md-center mt-5">
        <div className="d-flex flex-column flex-lg-row flex-fill justify-content-between align-items-lg-center">
          <div className="lead">
            <FormattedMessage id="account.greeting" />, {getFullName(user)}
          </div>
          <div>
            {user.email}
            {user.email && user.phoneNumber && <span className="text-separator mx-2">·</span>}
            <span className="me-3">{user.phoneNumber}</span>
          </div>
        </div>
        <div>
          <Link className="btn btn-light mt-3 mt-lg-0" to="/contact-details">
            <FormattedMessage id="account.update.contact" />
          </Link>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.login.user,
});

const withRedux = connect(mapStateToProps);

export default withRedux(GreetingBar);
