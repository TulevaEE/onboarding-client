import React from 'react';
import Types from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Message } from 'retranslate';

import { actions as thirdPillarActions } from '../../../../thirdPillar';
import { InfoTooltip } from '../../../../common';

export const ResidencyAgreement = ({ isResident, onResidentChange, className }) => {
  return (
    <div
      id="residency-radio-container"
      onChange={event => {
        onResidentChange(event.target.value === 'true');
      }}
      className={className}
    >
      <div className="custom-control custom-radio">
        <input
          defaultChecked={isResident}
          value="true"
          type="radio"
          name="resident"
          className="custom-control-input"
          id="third-pillar-resident-radio"
        />

        <label className="custom-control-label" htmlFor="third-pillar-resident-radio">
          <Message>thirdPillarAgreement.isResident</Message>
          <InfoTooltip name="resident-tooltip">
            <div className="content">
              <Message>thirdPillarAgreement.residentTooltip</Message>
            </div>
          </InfoTooltip>
        </label>
      </div>

      <div className="custom-control custom-radio">
        <input
          value="false"
          type="radio"
          name="resident"
          className="custom-control-input"
          id="third-pillar-not-resident-radio"
        />

        <label className="custom-control-label" htmlFor="third-pillar-not-resident-radio">
          <Message>thirdPillarAgreement.isNotResident</Message>
        </label>
      </div>
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
