import React from 'react';
import Types from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { Message, withTranslations } from 'retranslate';
import { actions as thirdPillarActions } from '../../../../thirdPillar';

export const OccupationAgreement = ({
  onOccupationChange,
  translations: { translate },
  className,
}) => {
  return (
    <div
      id="occupation-agreement"
      className={`form-inline ${className}`}
      onChange={event => onOccupationChange(event.target.value)}
    >
      <div className="form-group">
        <label htmlFor="occupation">
          <Message>thirdPillarAgreement.occupation</Message>
        </label>
        <select className="form-control ml-2" name="occupation" id="occupation">
          <option />
          <option value="PRIVATE_SECTOR">
            {translate('thirdPillarAgreement.occupation.privateSector')}
          </option>
          <option value="PUBLIC_SECTOR">
            {translate('thirdPillarAgreement.occupation.publicSector')}
          </option>
          <option value="THIRD_SECTOR">
            {translate('thirdPillarAgreement.occupation.thirdSector')}
          </option>
          <option value="ENTREPRENEUR">
            {translate('thirdPillarAgreement.occupation.entrepreneur')}
          </option>
          <option value="STUDENT">{translate('thirdPillarAgreement.occupation.student')}</option>
          <option value="RETIRED">{translate('thirdPillarAgreement.occupation.retired')}</option>
          <option value="UNEMPLOYED">
            {translate('thirdPillarAgreement.occupation.unemployed')}
          </option>
        </select>
      </div>
    </div>
  );
};

OccupationAgreement.propTypes = {
  onOccupationChange: Types.func,
  translations: Types.shape({
    translate: Types.func.isRequired,
  }).isRequired,
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
)(withTranslations(OccupationAgreement));
