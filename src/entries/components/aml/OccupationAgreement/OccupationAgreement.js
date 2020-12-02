import React from 'react';
import Types from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { Message, withTranslations } from 'retranslate';
import { Field } from 'redux-form';
import { changeOccupation } from '../actions';
import { renderField, requiredField } from '../../common/form';

export const OccupationAgreement = ({
  occupation,
  onOccupationChange,
  translations: { translate },
  className,
}) => {
  return (
    <div
      id="occupation-agreement"
      className={`${className}`}
      onChange={event => onOccupationChange(event.target.value)}
    >
      <div className="form-group">
        <label htmlFor="occupation">
          <Message>aml.occupation</Message>
        </label>
        <div className="form-group">
          <Field
            component={renderField}
            type="select"
            name="aml.occupation"
            validate={[requiredField]}
            id="occupation"
            override={{ value: occupation }}
          >
            <option />
            <option value="PRIVATE_SECTOR">{translate('aml.occupation.privateSector')}</option>
            <option value="PUBLIC_SECTOR">{translate('aml.occupation.publicSector')}</option>
            <option value="THIRD_SECTOR">{translate('aml.occupation.thirdSector')}</option>
            <option value="ENTREPRENEUR">{translate('aml.occupation.entrepreneur')}</option>
            <option value="STUDENT">{translate('aml.occupation.student')}</option>
            <option value="RETIRED">{translate('aml.occupation.retired')}</option>
            <option value="UNEMPLOYED">{translate('aml.occupation.unemployed')}</option>
          </Field>
        </div>
      </div>
    </div>
  );
};

OccupationAgreement.propTypes = {
  occupation: Types.string,
  onOccupationChange: Types.func,
  translations: Types.shape({
    translate: Types.func.isRequired,
  }).isRequired,
};

OccupationAgreement.defaultProps = {
  occupation: null,
  onOccupationChange: () => {},
};

const mapStateToProps = state => ({
  occupation: state.aml.occupation,
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      onOccupationChange: changeOccupation,
    },
    dispatch,
  );

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withTranslations(OccupationAgreement));
