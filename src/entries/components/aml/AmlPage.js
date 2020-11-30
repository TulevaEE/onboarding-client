import React, { Component } from 'react';
import { Message } from 'retranslate';
import { PropTypes as Types } from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import UpdateUserForm from '../contact-details/updateUserForm';
import { updateUser } from '../common/user/actions';
import PoliticallyExposedPersonAgreement from './PoliticallyExposedPersonAgreement';
import ResidencyAgreement from './ResidencyAgreement';
import OccupationAgreement from './OccupationAgreement';

const noop = () => null;

export class AmlPage extends Component {
  componentDidMount() {}

  render() {
    const { saveUser } = this.props;

    return (
      <div className="mt-5">
        <p className="mb-4 lead">
          <Message>update.user.details.title</Message>
        </p>
        <UpdateUserForm onSubmit={saveUser}>
          <p className="mt-4 mb-3 lead">Lisaandmed</p>
          <OccupationAgreement className="mt-3" />
          <PoliticallyExposedPersonAgreement className="mt-3" />
          <ResidencyAgreement className="mt-3 mb-4" />
        </UpdateUserForm>
      </div>
    );
  }
}

AmlPage.propTypes = {
  saveUser: Types.func,
};

AmlPage.defaultProps = {
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

export default withRedux(AmlPage);
