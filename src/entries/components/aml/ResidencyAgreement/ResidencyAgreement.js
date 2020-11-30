import React from 'react';
import Types from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Message } from 'retranslate';

import { changeIsResident } from '../actions';
import { InfoTooltip } from '../../common';

export const ResidencyAgreement = ({ isResident, onResidentChange, className }) => {
  return (
    <div className={className}>
      <div className="custom-control custom-checkbox">
        <input
          checked={!!isResident}
          onChange={e => onResidentChange(e.target.checked)}
          type="checkbox"
          name="resident"
          className="custom-control-input"
          id="aml-resident-checkbox"
        />

        <label className="custom-control-label" htmlFor="aml-resident-checkbox">
          <Message>aml.isResident</Message>
          <InfoTooltip name="resident-tooltip">
            <div className="content">
              <Message>aml.residentTooltip</Message>
            </div>
          </InfoTooltip>
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
  isResident: null,
  onResidentChange: () => {},
};

const mapStateToProps = state => ({
  isResident: state.aml.isResident,
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      onResidentChange: changeIsResident,
    },
    dispatch,
  );

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ResidencyAgreement);
