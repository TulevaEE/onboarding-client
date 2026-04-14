import React from 'react';
import Types from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { FormattedMessage } from 'react-intl';
import { changeIsPoliticallyExposed } from '../actions';
import { InfoTooltip } from '../../common/infoTooltip/InfoTooltip';

export const PoliticallyExposedPersonAgreement = ({
  isPoliticallyExposed,
  onPoliticallyExposedChange,
  className,
}) => (
  <div className={className}>
    <span className="form-label mb-2 d-block">
      <FormattedMessage id="aml.pepTitle" />
      <InfoTooltip name="pep-tooltip" place="top">
        <div className="content">
          <FormattedMessage id="aml.pepTooltip" />
        </div>
      </InfoTooltip>
    </span>
    <div className="form-check">
      <input
        type="radio"
        name="aml.isPoliticallyExposed"
        id="aml-pep-yes"
        checked={isPoliticallyExposed === true}
        onChange={() => onPoliticallyExposedChange(true)}
        className="form-check-input"
      />
      <label className="form-check-label" htmlFor="aml-pep-yes">
        <FormattedMessage id="aml.isPep" />
      </label>
    </div>
    <div className="form-check">
      <input
        type="radio"
        name="aml.isPoliticallyExposed"
        id="aml-pep-no"
        checked={isPoliticallyExposed === false}
        onChange={() => onPoliticallyExposedChange(false)}
        className="form-check-input"
      />
      <label className="form-check-label" htmlFor="aml-pep-no">
        <FormattedMessage id="aml.isNotPep" />
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
