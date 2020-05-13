import React, { Component } from 'react';
import { Message } from 'retranslate';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

export class GreetingBar extends Component {
  componentDidMount() {}

  render() {
    const { user } = this.props;
    return (
      <>
        <div className="col-md-auto mb-1 mt-2 lead">
          <Message>account.greeting</Message>, {user.firstName} {user.lastName}
        </div>
        <div className="col mb-1 mt-2 text-md-right">
          {user.email} · {user.phoneNumber}
          <Link className="btn btn-light" to="/contact-detail">
            <Message>account.update.contact</Message>
          </Link>
        </div>
      </>
    );
  }
}

const mapStateToProps = state => ({
  user: state.login.user,
});

const withRedux = connect(mapStateToProps);

export default withRedux(GreetingBar);
