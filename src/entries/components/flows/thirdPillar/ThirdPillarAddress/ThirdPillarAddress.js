import React, { Fragment } from 'react';
import { PropTypes as Types } from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Redirect } from 'react-router-dom';
import UpdateUserForm from '../../../account/updateUserForm';
import { updateUser } from '../../../common/user/actions';
import { hasAddress } from '../../../common/user/address';

export const ThirdPillarAddress = ({
  previousPath,
  nextPath,
  isAddressFilled,
  monthlyContribution,
  saveUser,
}) => (
  <Fragment>
    {!monthlyContribution && <Redirect to={previousPath} />}
    {isAddressFilled && <Redirect to={nextPath} />}
    <UpdateUserForm onSubmit={saveUser} />
  </Fragment>
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
      saveUser: updateUser,
    },
    dispatch,
  );

const withRedux = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default withRedux(ThirdPillarAddress);
