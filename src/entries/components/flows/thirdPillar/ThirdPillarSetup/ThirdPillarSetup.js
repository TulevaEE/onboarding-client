import React from 'react';
import Types from 'prop-types';
import { bindActionCreators } from 'redux';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { Message } from 'retranslate';

import { actions as thirdPillarActions } from '../../../thirdPillar';

export const ThirdPillarSetup = ({
  monthlyContribution,
  onMonthlyContributionChange,
  exchangeableSourceFunds,
  exchangeExistingUnits,
  onExchangeExistingUnitsChange,
  nextPath,
}) => (
  <div>
    <div className="form-group">
      <label htmlFor="monthly-contribution">
        <Message>thirdPillarFlowSetup.monthlyContributionLabel</Message>
      </label>
      <input
        id="monthly-contribution"
        type="number"
        value={monthlyContribution || ''}
        onChange={event => {
          onMonthlyContributionChange(parseInt(event.target.value, 10));
        }}
        className="form-control form-control-lg"
      />
    </div>

    {exchangeableSourceFunds.length > 0 && (
      <label
        className="custom-control custom-checkbox mt-3"
        htmlFor="exchange-existing-units-checkbox"
      >
        <input
          checked={exchangeExistingUnits}
          onChange={() => onExchangeExistingUnitsChange(!exchangeExistingUnits)}
          type="checkbox"
          className="custom-control-input"
          id="exchange-existing-units-checkbox"
        />
        <span className="custom-control-indicator" />
        <div className="custom-control-description">
          <Message>thirdPillarFlowSetup.exchangeExistingUnitsLabel</Message>
        </div>
      </label>
    )}

    <div>
      <Link to={nextPath}>
        <button type="button" className="btn btn-primary mt-2" disabled={!monthlyContribution}>
          <Message>thirdPillarFlowSetup.buttonText</Message>
        </button>
      </Link>
    </div>
  </div>
);

ThirdPillarSetup.propTypes = {
  monthlyContribution: Types.number,
  onMonthlyContributionChange: Types.func,
  exchangeableSourceFunds: Types.arrayOf(Types.shape()),
  exchangeExistingUnits: Types.bool,
  onExchangeExistingUnitsChange: Types.func,
  nextPath: Types.string,
};

const noop = () => {};

ThirdPillarSetup.defaultProps = {
  monthlyContribution: null,
  onMonthlyContributionChange: noop,
  exchangeableSourceFunds: [],
  exchangeExistingUnits: false,
  onExchangeExistingUnitsChange: noop,
  nextPath: '',
};

const mapStateToProps = state => ({
  monthlyContribution: state.thirdPillar.monthlyContribution,
  exchangeExistingUnits: state.thirdPillar.exchangeExistingUnits,
  exchangeableSourceFunds: state.thirdPillar.exchangeableSourceFunds,
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      onMonthlyContributionChange: thirdPillarActions.changeMonthlyContribution,
      onExchangeExistingUnitsChange: thirdPillarActions.changeExchangeExistingUnits,
    },
    dispatch,
  );

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ThirdPillarSetup);
