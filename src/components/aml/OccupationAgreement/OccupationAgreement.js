import React from 'react';
import Types from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { Field } from 'redux-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { changeOccupation } from '../actions';
import { renderField, requiredField } from '../../common/form';

export const OccupationAgreement = ({ occupation, onOccupationChange, className }) => {
  const { formatMessage } = useIntl();

  return (
    <div
      id="occupation-agreement"
      className={`${className}`}
      onChange={(event) => onOccupationChange(event.target.value)}
    >
      <div className="mb-3">
        <label htmlFor="occupation">
          <FormattedMessage id="aml.occupation" />
        </label>
        <div className="mb-3">
          <Field
            component={renderField}
            type="select"
            name="aml.occupation"
            validate={[requiredField]}
            id="occupation"
            override={{ value: occupation }}
          >
            <option value="">{formatMessage({ id: 'select' })}</option>
            <option value="PRIVATE_SECTOR">
              {formatMessage({ id: 'aml.occupation.privateSector' })}
            </option>
            <option value="PUBLIC_SECTOR">
              {formatMessage({ id: 'aml.occupation.publicSector' })}
            </option>
            <option value="THIRD_SECTOR">
              {formatMessage({ id: 'aml.occupation.thirdSector' })}
            </option>
            <option value="ENTREPRENEUR">
              {formatMessage({ id: 'aml.occupation.entrepreneur' })}
            </option>
            <option value="STUDENT">{formatMessage({ id: 'aml.occupation.student' })}</option>
            <option value="RETIRED">{formatMessage({ id: 'aml.occupation.retired' })}</option>
            <option value="UNEMPLOYED">{formatMessage({ id: 'aml.occupation.unemployed' })}</option>
          </Field>
        </div>
      </div>
    </div>
  );
};

OccupationAgreement.propTypes = {
  occupation: Types.string,
  onOccupationChange: Types.func,
};

OccupationAgreement.defaultProps = {
  occupation: null,
  onOccupationChange: () => {},
};

const mapStateToProps = (state) => ({
  occupation: state.aml.occupation,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      onOccupationChange: changeOccupation,
    },
    dispatch,
  );

export default connect(mapStateToProps, mapDispatchToProps)(OccupationAgreement);
