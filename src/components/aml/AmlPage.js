import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import UpdateUserForm from '../contact-details/updateUserForm';
import PoliticallyExposedPersonAgreement from './PoliticallyExposedPersonAgreement';
import ResidencyAgreement from './ResidencyAgreement';
import OccupationAgreement from './OccupationAgreement';
import { updateUserAndAml } from './actions';

const noop = () => null;

export const AmlPage = ({ save, updateUserSuccess, createAmlChecksSuccess, location }) => (
  <div className="col-sm-10 col-md-8 col-lg-6 mx-auto">
    {updateUserSuccess && createAmlChecksSuccess && (
      <Redirect to={location.state && location.state.from ? location.state.from : ''} />
    )}
    <h1 className="mb-3">
      <FormattedMessage id="update.user.details.title" />
    </h1>
    <p className="mb-5">
      <FormattedMessage id="aml.updateContactDetails" />
    </p>
    <UpdateUserForm onSubmit={save}>
      <PoliticallyExposedPersonAgreement className="mt-3" />
      <OccupationAgreement className="mt-3" />
      <ResidencyAgreement className="mt-3 mb-4" />
    </UpdateUserForm>
  </div>
);

AmlPage.propTypes = {
  updateUserSuccess: Types.bool,
  createAmlChecksSuccess: Types.bool,
  save: Types.func,
  location: Types.shape({ state: Types.shape({ from: Types.string }) }),
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
