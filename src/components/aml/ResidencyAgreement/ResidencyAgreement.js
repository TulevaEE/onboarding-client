import React from 'react';
import Types from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { Field } from 'redux-form';
import { FormattedMessage } from 'react-intl';
import { changeIsResident } from '../actions';
import { InfoTooltip } from '../../common/infoTooltip/InfoTooltip';
import { requiredField } from '../../common/form';

export const ResidencyAgreement = ({ isResident, onResidentChange, className }) => (
  <div className={className}>
    <div className="form-check">
      <Field
        checked={!!isResident}
        onChange={(e) => onResidentChange(e.target.checked)}
        component="input"
        type="checkbox"
        name="aml.isResident"
        id="aml-resident-checkbox"
        className="form-check-input"
        validate={[requiredField]}
      />

      <label className="form-check-label" htmlFor="aml-resident-checkbox">
        <FormattedMessage id="aml.isResident" />
        <InfoTooltip name="resident-tooltip">
          <div className="content">
            <FormattedMessage id="aml.residentTooltip" />
          </div>
        </InfoTooltip>
      </label>
    </div>
  </div>
);

ResidencyAgreement.propTypes = {
  isResident: Types.bool,
  onResidentChange: Types.func,
};

ResidencyAgreement.defaultProps = {
  isResident: null,
  onResidentChange: () => {},
};

const mapStateToProps = (state) => ({
  isResident: state.aml.isResident,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      onResidentChange: changeIsResident,
    },
    dispatch,
  );

export default connect(mapStateToProps, mapDispatchToProps)(ResidencyAgreement);
