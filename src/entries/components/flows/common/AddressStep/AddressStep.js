import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Redirect } from 'react-router-dom';
import UpdateUserForm from '../../../contact-details/updateUserForm';
import { updateUser, updateUserEmailAndPhone } from '../../../common/user/actions';
import { hasAddress } from '../../../common/user/address';

export const AddressStep = ({
  nextPath,
  isAddressFilled,
  updateOnlyEmailAndPhone,
  updateFullUser,
  updateEmailAndPhone,
}) => (
  <>
    {isAddressFilled && <Redirect to={nextPath} />}
    <UpdateUserForm
      onSubmit={user =>
        updateOnlyEmailAndPhone ? updateEmailAndPhone(user) : updateFullUser(user)
      }
    />
  </>
);

const noop = () => null;

AddressStep.propTypes = {
  nextPath: Types.string.isRequired,
  isAddressFilled: Types.bool,
  updateEmailAndPhone: Types.func,
  updateFullUser: Types.func,
};

AddressStep.defaultProps = {
  isAddressFilled: false,
  updateEmailAndPhone: noop,
  updateFullUser: noop,
};

const mapStateToProps = state => {
  return {
    isAddressFilled: state.login.user && hasAddress(state.login.user),
  };
};

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      updateEmailAndPhone: updateUserEmailAndPhone,
      updateFullUser: updateUser,
    },
    dispatch,
  );

const withRedux = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default withRedux(AddressStep);
