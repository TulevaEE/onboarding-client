import React, { PureComponent } from 'react';
import { PropTypes as Types } from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Redirect } from 'react-router-dom';
import UpdateUserForm from '../../../contact-details/updateUserForm';
import { updateUser, updateUserWithoutEpisUpdate } from '../../../common/user/actions';
import { hasAddress as isAddressFilled } from '../../../common/user/address';
import { hasContactDetailsAmlCheck as isContactDetailsAmlCheckPassed } from '../../../aml';

export class AddressStep extends PureComponent {
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

    const shouldSkipAddressStep = () =>
      pillar === 2 ? hasAddress : hasAddress && hasContactDetailsAmlCheck;

    return (
      <>
        {shouldSkipAddressStep() && <Redirect to={nextPath} />}
        <div className="row">
          <div className="col-md-8 col-lg-6">
            <UpdateUserForm
              onSubmit={(user) =>
                updateOnlyEmailAndPhone ? updateEmailAndPhone(user) : updateFullUser(user)
              }
            />
          </div>
        </div>
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
  updateOnlyEmailAndPhone: Types.bool,
  updateEmailAndPhone: Types.func,
  updateFullUser: Types.func,
};

AddressStep.defaultProps = {
  hasAddress: false,
  hasContactDetailsAmlCheck: false,
  updateOnlyEmailAndPhone: false,
  updateEmailAndPhone: noop,
  updateFullUser: noop,
};

const mapStateToProps = (state) => ({
  hasAddress: state.login.user && isAddressFilled(state.login.user),
  hasContactDetailsAmlCheck: isContactDetailsAmlCheckPassed(state.aml.missingAmlChecks),
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      updateEmailAndPhone: updateUserWithoutEpisUpdate,
      updateFullUser: updateUser,
    },
    dispatch,
  );

const withRedux = connect(mapStateToProps, mapDispatchToProps);

export default withRedux(AddressStep);
