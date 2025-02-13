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
        <div className="d-flex justify-content-between align-items-center">
          <div style={{ width: '200px' }}>
            <Shimmer height={30} />
          </div>
          <div style={{ width: '320px' }}>
            <Shimmer height={24} />
          </div>
        </div>
      );
    }
    return (
      <div className="my-5 d-flex flex-column flex-md-row gap-4 row-gap-1 align-items-md-center">
        <div className="d-flex flex-column flex-lg-row row-gap-1 flex-fill justify-content-between align-items-baseline align-items-lg-center">
          <p className="m-0 lead">
            <FormattedMessage id="account.greeting" />, {getFullName(user)}
          </p>
          <div className="d-flex">
            {user.email}
            {user.email && user.phoneNumber && <span className="text-separator mx-2">·</span>}
            {user.phoneNumber}
          </div>
        </div>
        <div>
          <Link className="icon-link" to="/contact-details">
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
