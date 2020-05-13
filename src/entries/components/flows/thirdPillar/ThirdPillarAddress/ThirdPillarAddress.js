import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Redirect } from 'react-router-dom';
import UpdateUserForm from '../../../contact-details/updateUserForm';
import { updateUserEmailAndPhone } from '../../../common/user/actions';
import { hasAddress } from '../../../common/user/address';

export const ThirdPillarAddress = ({ nextPath, isAddressFilled, saveUser }) => (
  <>
    {isAddressFilled && <Redirect to={nextPath} />}
    <UpdateUserForm onSubmit={saveUser} />
  </>
);

const noop = () => null;

ThirdPillarAddress.propTypes = {
  nextPath: Types.string,
  isAddressFilled: Types.bool,
  saveUser: Types.func,
};

ThirdPillarAddress.defaultProps = {
  nextPath: '',
  isAddressFilled: false,
  saveUser: noop,
};

const mapStateToProps = state => {
  return {
    isAddressFilled: state.login.user && hasAddress(state.login.user),
    monthlyContribution: state.thirdPillar.monthlyContribution,
  };
};

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      saveUser: updateUserEmailAndPhone,
    },
    dispatch,
  );

const withRedux = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default withRedux(ThirdPillarAddress);
