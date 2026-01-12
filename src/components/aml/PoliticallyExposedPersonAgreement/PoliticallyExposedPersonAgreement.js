import React from 'react';
import Types from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Field } from 'redux-form';

import { FormattedMessage } from 'react-intl';
import { changeIsPoliticallyExposed } from '../actions';
import { InfoTooltip } from '../../common/infoTooltip/InfoTooltip';

export const PoliticallyExposedPersonAgreement = ({
  isPoliticallyExposed,
  onPoliticallyExposedChange,
  className,
}) => (
  <div className={className}>
    <div className="form-check">
      <Field
        checked={isPoliticallyExposed === false}
        onChange={(e) => onPoliticallyExposedChange(!e.target.checked)}
        component="input"
        type="checkbox"
        name="aml.isNotPoliticallyExposed"
        id="aml-not-pep-checkbox"
        className="form-check-input"
      />
      <label className="form-check-label" htmlFor="aml-not-pep-checkbox">
        <FormattedMessage id="aml.isNotPep" />
        <InfoTooltip name="pep-tooltip">
          <div className="content">
            <FormattedMessage id="aml.pepTooltip" />
          </div>
        </InfoTooltip>
      </label>
    </div>
  </div>
);

PoliticallyExposedPersonAgreement.propTypes = {
  isPoliticallyExposed: Types.bool,
  onPoliticallyExposedChange: Types.func,
  className: Types.string,
};

PoliticallyExposedPersonAgreement.defaultProps = {
  isPoliticallyExposed: null,
  onPoliticallyExposedChange: () => {},
  className: '',
};

const mapStateToProps = (state) => ({
  isPoliticallyExposed: state.aml.isPoliticallyExposed,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      onPoliticallyExposedChange: changeIsPoliticallyExposed,
    },
    dispatch,
  );

export default connect(mapStateToProps, mapDispatchToProps)(PoliticallyExposedPersonAgreement);
