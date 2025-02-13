import React from 'react';
import { FormattedMessage } from 'react-intl';
import { PropTypes as Types } from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import UpdateUserForm from './updateUserForm';
import { updateUser } from '../common/user/actions';

const noop = () => null;

export const ContactDetailsPage = ({ saveUser }) => (
  <div className="col-sm-8 col-md-6 col-lg-5 mx-auto">
    <h2 className="mt-5 mb-4">
      <FormattedMessage id="update.user.details.title" />
    </h2>
    <UpdateUserForm onSubmit={saveUser} />
  </div>
);

ContactDetailsPage.propTypes = {
  saveUser: Types.func,
};

ContactDetailsPage.defaultProps = {
  saveUser: noop,
};

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      saveUser: updateUser,
    },
    dispatch,
  );

const withRedux = connect(null, mapDispatchToProps);

export default withRedux(ContactDetailsPage);
