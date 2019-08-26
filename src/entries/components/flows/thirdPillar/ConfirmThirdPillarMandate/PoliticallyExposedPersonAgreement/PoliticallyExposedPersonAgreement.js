import React from 'react';
import Types from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Message } from 'retranslate';

import { actions as thirdPillarActions } from '../../../../thirdPillar';
import { InfoTooltip } from '../../../../common';

export const PoliticallyExposedPersonAgreement = ({
  isPoliticallyExposed,
  onPoliticallyExposedChange,
}) => {
  return (
    <div
      id="pep-radio-container"
      onChange={event => onPoliticallyExposedChange(event.target.value === 'true')}
    >
      <div className="custom-control custom-radio">
        <input
          defaultChecked={false}
          value="false"
          type="radio"
          name="pep"
          className="custom-control-input"
          id="third-pillar-not-pep-radio"
        />

        <label className="custom-control-label" htmlFor="third-pillar-not-pep-radio">
          <Message>thirdPillarAgreement.isNotPep</Message>
          <InfoTooltip name="pep-tooltip">
            <div className="content">
              <Message>thirdPillarAgreement.pepTooltip</Message>
            </div>
          </InfoTooltip>
        </label>
      </div>

      <div className="custom-control custom-radio">
        <input
          defaultChecked={isPoliticallyExposed}
          value="true"
          type="radio"
          name="pep"
          className="custom-control-input"
          id="third-pillar-pep-radio"
        />

        <label className="custom-control-label" htmlFor="third-pillar-pep-radio">
          <Message>thirdPillarAgreement.isPep</Message>
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
  isPoliticallyExposed: false,
  onPoliticallyExposedChange: () => {},
};

const mapStateToProps = state => ({
  isPoliticallyExposed: state.thirdPillar.isPoliticallyExposed,
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      onPoliticallyExposedChange: thirdPillarActions.changeIsPoliticallyExposed,
    },
    dispatch,
  );

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(PoliticallyExposedPersonAgreement);
