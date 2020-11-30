import React from 'react';
import Types from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Message } from 'retranslate';

import { changeIsPoliticallyExposed } from '../actions';
import { InfoTooltip } from '../../common';

export const PoliticallyExposedPersonAgreement = ({
  isPoliticallyExposed,
  onPoliticallyExposedChange,
  className,
}) => {
  return (
    <div className={className}>
      <div className="custom-control custom-checkbox">
        <input
          checked={isPoliticallyExposed === false}
          onChange={e => onPoliticallyExposedChange(!e.target.checked)}
          type="checkbox"
          name="pep"
          className="custom-control-input"
          id="aml-not-pep-checkbox"
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
