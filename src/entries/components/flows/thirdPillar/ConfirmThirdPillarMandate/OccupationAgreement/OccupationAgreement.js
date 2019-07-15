import React from 'react';
import Types from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { actions as thirdPillarActions } from '../../../../thirdPillar';

export const OccupationAgreement = ({ onOccupationChange }) => {
  return (
    <div
      id="occupation-agreement"
      className="form-inline"
      onChange={event => onOccupationChange(event.target.value)}
    >
      <div className="form-group">
        <label htmlFor="occupation">Tegevusala: </label>
        <select className="form-control ml-2" name="occupation" id="occupation">
          <option />
          <option value="PRIVATE_SECTOR">Erasektori töötaja</option>
          <option value="PUBLIC_SECTOR">Avaliku sektori töötaja</option>
          <option value="ENTREPRENEUR">Ettevõtja (sh FIE)</option>
          <option value="STUDENT">Õpilane või üliõpilaine</option>
          <option value="RETIRED">Pensionär</option>
          <option value="UNEMPLOYED">Hetkel ei tööta</option>
        </select>
      </div>
    </div>
  );
};

OccupationAgreement.propTypes = {
  onOccupationChange: Types.func,
};

OccupationAgreement.defaultProps = {
  onOccupationChange: () => {},
};

const mapStateToProps = state => ({
  occupation: state.thirdPillar.occupation,
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      onOccupationChange: thirdPillarActions.changeOccupation,
    },
    dispatch,
  );

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(OccupationAgreement);
