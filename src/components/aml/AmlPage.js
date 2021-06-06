import React from 'react';
import { Message } from 'retranslate';
import { PropTypes as Types } from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import UpdateUserForm from '../contact-details/updateUserForm';
import ResidencyAgreement from './ResidencyAgreement';
import OccupationAgreement from './OccupationAgreement';
import { updateUserAndAml } from './actions';

const noop = () => null;

export const AmlPage = ({ save, updateUserSuccess, createAmlChecksSuccess, location }) => {
  return (
    <div className="mt-5">
      {updateUserSuccess && createAmlChecksSuccess && (
        <Redirect to={location.state && location.state.from ? location.state.from : ''} />
      )}
      <p>
        <Message>aml.updateContactDetails</Message>
      </p>
      <p className="mb-4 lead">
        <Message>update.user.details.title</Message>
      </p>
      <UpdateUserForm onSubmit={save}>
        <p className="mt-4 mb-3 lead">
          <Message>aml.extraDetails</Message>
        </p>
        <OccupationAgreement className="mt-3" />
        <ResidencyAgreement className="mt-3 mb-4" />
      </UpdateUserForm>
    </div>
  );
};

AmlPage.propTypes = {
  updateUserSuccess: Types.bool,
  createAmlChecksSuccess: Types.bool,
  save: Types.func,
  location: Types.shape({ state: { from: Types.string } }),
};

AmlPage.defaultProps = {
  updateUserSuccess: false,
  createAmlChecksSuccess: false,
  location: { state: { from: '' } },
  save: noop,
};

const mapStateToProps = (state) => ({
  updateUserSuccess: state.contactDetails.updateUserSuccess,
  createAmlChecksSuccess: state.aml.createAmlChecksSuccess,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      save: updateUserAndAml,
    },
    dispatch,
  );

const withRedux = connect(mapStateToProps, mapDispatchToProps);

export default withRedux(AmlPage);
