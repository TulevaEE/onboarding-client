import React, { Component } from 'react';
import { Message } from 'retranslate';
import { PropTypes as Types } from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import UpdateUserForm from './updateUserForm';
import { updateUser } from '../common/user/actions';

const noop = () => null;

export class ContactDetailPage extends Component {
  componentDidMount() {}

  render() {
    const { saveUser } = this.props;

    return (
      <div className="mt-5">
        <p className="mb-4 lead">
          <Message>update.user.details.title</Message>
        </p>
        <UpdateUserForm onSubmit={saveUser} />
      </div>
    );
  }
}

ContactDetailPage.propTypes = {
  saveUser: Types.func,
};

ContactDetailPage.defaultProps = {
  saveUser: noop,
};

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      saveUser: updateUser,
    },
    dispatch,
  );

const withRedux = connect(
  null,
  mapDispatchToProps,
);

export default withRedux(ContactDetailPage);
