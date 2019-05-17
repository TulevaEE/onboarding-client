import React from 'react';
import Types from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Message } from 'retranslate';

import { actions as thirdPillarActions } from '../../../../thirdPillar';

export const ResidencyAgreement = ({ isResident, onResidentChange }) => {
  return (
    <div
      id="residency-radio-container"
      onChange={event => {
        onResidentChange(event.target.value === 'true');
      }}
      className="mt-5"
    >
      <label className="custom-control custom-radio" htmlFor="third-pillar-resident-radio">
        <input
          defaultChecked={isResident}
          value="true"
          type="radio"
          name="resident"
          className="custom-control-input"
          id="third-pillar-resident-radio"
        />

        <span className="custom-control-indicator" />

        <div className="custom-control-description">
          <Message>thirdPillarAgreement.isResident</Message>
        </div>
      </label>

      <label className="custom-control custom-radio" htmlFor="third-pillar-not-resident-radio">
        <input
          value="false"
          type="radio"
          name="resident"
          className="custom-control-input"
          id="third-pillar-not-resident-radio"
        />

        <span className="custom-control-indicator" />

        <div className="custom-control-description">
          <Message>thirdPillarAgreement.isNotResident</Message>
        </div>
      </label>
    </div>
  );
};

ResidencyAgreement.propTypes = {
  isResident: Types.bool,
  onResidentChange: Types.func,
};

ResidencyAgreement.defaultProps = {
  isResident: false,
  onResidentChange: () => {},
};

const mapStateToProps = state => ({
  isResident: state.thirdPillar.isResident,
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      onResidentChange: thirdPillarActions.changeIsResident,
    },
    dispatch,
  );

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ResidencyAgreement);
