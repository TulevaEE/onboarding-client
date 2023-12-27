import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Shimmer } from '../../common/shimmer/Shimmer';

export class GreetingBar extends Component {
  componentDidMount() {}

  render() {
    const { user } = this.props;
    if (!user) {
      return (
        <div className="col mb-1 mt-2">
          <Shimmer height={38} />
        </div>
      );
    }
    return (
      <>
        <div className="col-md-auto mb-1 mt-2 lead">
          <FormattedMessage id="account.greeting" />, {user.firstName} {user.lastName}!
        </div>
        <div className="col mb-1 mt-2 text-md-right">
          {user.email}
          {user.email && user.phoneNumber && <span className="mx-1"> · </span>}
          <span className="mr-2">{user.phoneNumber} </span>
          <Link className="btn btn-light mt-2 mt-sm-0" to="/contact-details">
            <FormattedMessage id="account.update.contact" />
          </Link>
        </div>
      </>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.login.user,
});

const withRedux = connect(mapStateToProps);

export default withRedux(GreetingBar);
