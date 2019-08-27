import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Redirect } from 'react-router-dom';
import UpdateUserForm from '../../../account/updateUserForm';
import { updateUserEmailAndPhone } from '../../../common/user/actions';
import { hasAddress } from '../../../common/user/address';

export const ThirdPillarAddress = ({
  previousPath,
  nextPath,
  isAddressFilled,
  monthlyContribution,
  saveUser,
}) => (
  <>
    {!monthlyContribution && <Redirect to={previousPath} />}
    {isAddressFilled && <Redirect to={nextPath} />}
    <UpdateUserForm onSubmit={saveUser} />
  </>
);

const noop = () => null;

ThirdPillarAddress.propTypes = {
  previousPath: Types.string,
  nextPath: Types.string,
  isAddressFilled: Types.bool,
  monthlyContribution: Types.number,
  saveUser: Types.func,
};

ThirdPillarAddress.defaultProps = {
  previousPath: '',
  nextPath: '',
  isAddressFilled: false,
  monthlyContribution: null,
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
