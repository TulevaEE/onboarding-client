import React from 'react';
import Types from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Message } from 'retranslate';
import { Field } from 'redux-form';

import { changeIsPoliticallyExposed } from '../actions';
import { InfoTooltip } from '../../common';
import { requiredField } from '../../common/form';

export const PoliticallyExposedPersonAgreement = ({
  isPoliticallyExposed,
  onPoliticallyExposedChange,
  className,
}) => {
  return (
    <div className={className}>
      <div className="custom-control custom-checkbox">
        <Field
          checked={isPoliticallyExposed === false}
          onChange={e => onPoliticallyExposedChange(!e.target.checked)}
          component="input"
          type="checkbox"
          name="aml.isNotPoliticallyExposed"
          id="aml-not-pep-checkbox"
          className="custom-control-input"
          validate={[requiredField]}
        />
        <label className="custom-control-label" htmlFor="aml-not-pep-checkbox">
          <Message>aml.isNotPep</Message>
          <InfoTooltip name="pep-tooltip">
            <div className="content">
              <Message>aml.pepTooltip</Message>
            </div>
          </InfoTooltip>
        </label>
      </div>
    </div>
  );
};

PoliticallyExposedPersonAgreement.propTypes = {
  isPoliticallyExposed: Types.bool,
  onPoliticallyExposedChange: Types.func,
};

PoliticallyExposedPersonAgreement.defaultProps = {
  isPoliticallyExposed: null,
  onPoliticallyExposedChange: () => {},
};

const mapStateToProps = state => ({
  isPoliticallyExposed: state.aml.isPoliticallyExposed,
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      onPoliticallyExposedChange: changeIsPoliticallyExposed,
    },
    dispatch,
  );

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(PoliticallyExposedPersonAgreement);
