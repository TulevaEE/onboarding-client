import React from 'react';
import Types from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Message } from 'retranslate';

import { actions as thirdPillarActions } from '../../../../thirdPillar';

export const PoliticallyExposedPersonAgreement = ({
  isPoliticallyExposed,
  onPoliticallyExposedChange,
}) => {
  return (
    <div
      id="pep-radio-container"
      onChange={event => onPoliticallyExposedChange(event.target.value === 'true')}
    >
      <label className="custom-control custom-radio" htmlFor="third-pillar-not-pep-radio">
        <input
          defaultChecked={false}
          value="false"
          type="radio"
          name="pep"
          className="custom-control-input"
          id="third-pillar-not-pep-radio"
        />

        <span className="custom-control-indicator" />

        <div className="custom-control-description">
          <Message>thirdPillarAgreement.isNotPep</Message>
        </div>
      </label>

      <label className="custom-control custom-radio" htmlFor="third-pillar-pep-radio">
        <input
          defaultChecked={isPoliticallyExposed}
          value="true"
          type="radio"
          name="pep"
          className="custom-control-input"
          id="third-pillar-pep-radio"
        />

        <span className="custom-control-indicator" />

        <div className="custom-control-description">
          <Message>thirdPillarAgreement.isPep</Message>
        </div>
      </label>
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
