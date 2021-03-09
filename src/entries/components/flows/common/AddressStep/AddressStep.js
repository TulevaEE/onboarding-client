import React, { Component } from 'react';
import { PropTypes as Types } from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Redirect } from 'react-router-dom';
import UpdateUserForm from '../../../contact-details/updateUserForm';
import { updateUser, updateUserEmailAndPhone } from '../../../common/user/actions';
import { hasAddress as isAddressFilled } from '../../../common/user/address';
import { hasContactDetailsAmlCheck as isContactDetailsAmlCheckPassed } from '../../../aml';

export class AddressStep extends Component {
  render() {
    const {
      nextPath,
      pillar,
      hasAddress,
      hasContactDetailsAmlCheck,
      updateOnlyEmailAndPhone,
      updateFullUser,
      updateEmailAndPhone,
    } = this.props;
    const shouldSkipAddressStep = () => {
      return pillar === 2 ? hasAddress : hasAddress && hasContactDetailsAmlCheck;
    };
    return (
      <>
        {shouldSkipAddressStep() && <Redirect to={nextPath} />}
        <UpdateUserForm
          onSubmit={(user) =>
            updateOnlyEmailAndPhone ? updateEmailAndPhone(user) : updateFullUser(user)
          }
        />
      </>
    );
  }
}

const noop = () => null;

AddressStep.propTypes = {
  nextPath: Types.string.isRequired,
  pillar: Types.number.isRequired,
  hasAddress: Types.bool,
  hasContactDetailsAmlCheck: Types.bool,
  updateEmailAndPhone: Types.func,
  updateFullUser: Types.func,
};

AddressStep.defaultProps = {
  hasAddress: false,
  hasContactDetailsAmlCheck: false,
  updateEmailAndPhone: noop,
  updateFullUser: noop,
};

const mapStateToProps = (state) => {
  return {
    hasAddress: state.login.user && isAddressFilled(state.login.user),
    hasContactDetailsAmlCheck: isContactDetailsAmlCheckPassed(state.aml.missingAmlChecks),
  };
};

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      updateEmailAndPhone: updateUserEmailAndPhone,
      updateFullUser: updateUser,
    },
    dispatch,
  );

const withRedux = connect(mapStateToProps, mapDispatchToProps);

export default withRedux(AddressStep);
