import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { Link, Redirect } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import { Radio } from '../../../common';
import { selectThirdPillarSources } from '../../../thirdPillar/actions';
import AccountStatement from '../../../account/AccountStatement';

// TODO: don't import from 2nd pillar flow
import TargetFundSelector from '../../secondPillar/selectSources/targetFundSelector';
import { Shimmer } from '../../../common/shimmer/Shimmer';
import { isTestMode } from '../../../common/test-mode';

export const ThirdPillarSelectSources = ({
  exchangeExistingUnits,
  futureContributionsFundIsin,
  loadingSourceFunds,
  loadingTargetFunds,
  targetFunds,
  exchangeableSourceFunds,
  onSelect,
  nextPath,
  loading,
}) => {
  const { formatMessage } = useIntl();

  const isTestModeEnabled = isTestMode();

  const fullSelectionActive = !!exchangeExistingUnits && !!futureContributionsFundIsin;
  const someSelectionActive = !exchangeExistingUnits && !!futureContributionsFundIsin;
  const isValid = exchangeExistingUnits || futureContributionsFundIsin;
  const defaultTargetFund = targetFunds && targetFunds.length ? targetFunds[0] : {};

  if (loading || loadingSourceFunds || loadingTargetFunds) {
    return <Shimmer height={26} />;
  }

  return (
    <div>
      {!isTestModeEnabled && exchangeableSourceFunds && !exchangeableSourceFunds.length && (
        <Redirect to={nextPath} />
      )}
      <div className="row">
        <div className="col-12">
          <div className="mb-4">
            <p className="mb-4 lead">
              <FormattedMessage id="thirdPillarFlowSelectSources.title" />
            </p>
            {exchangeableSourceFunds && !!exchangeableSourceFunds.length && (
              <AccountStatement funds={exchangeableSourceFunds} />
            )}
          </div>
        </div>
      </div>
      <Radio
        name="tv-select-sources-type"
        id="tv-select-sources-type-all"
        selected={fullSelectionActive}
        onSelect={() => onSelect(true, defaultTargetFund.isin)}
      >
        <h3 className="m-0">
          <FormattedMessage id="thirdPillarFlowSelectSources.selectAll.title" />
        </h3>
        {fullSelectionActive ? (
          <div className="mt-3">
            <FormattedMessage id="thirdPillarFlowSelectSources.selectAll.subtitle" />

            <br />
            <br />

            <FormattedMessage
              id="thirdPillarFlowSelectSources.insurance_info"
              values={{
                a: (chunks) => (
                  <a
                    href={formatMessage({
                      id: 'thirdPillarFlowSelectSources.insurance_info.link',
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {chunks}
                  </a>
                ),
              }}
            />

            <TargetFundSelector
              targetFunds={targetFunds}
              onSelectFund={(targetFund) => onSelect(true, targetFund.isin)}
            />
          </div>
        ) : (
          ''
        )}
      </Radio>
      <Radio
        name="tv-select-sources-type"
        id="tv-select-sources-type-some"
        className="mt-3"
        selected={someSelectionActive}
        onSelect={() => onSelect(false, defaultTargetFund.isin)}
      >
        <h3 className="m-0">
          <FormattedMessage id="thirdPillarFlowSelectSources.futureContributions.title" />
        </h3>
        {someSelectionActive ? (
          <div className="mt-3">
            <FormattedMessage id="thirdPillarFlowSelectSources.futureContributions.subtitle" />
          </div>
        ) : (
          ''
        )}
      </Radio>

      <Link to={isValid ? nextPath : '#'}>
        <button
          type="button"
          id="nextStep"
          className={`btn btn-primary mt-5 ${!isValid ? 'disabled' : ''}`}
        >
          <FormattedMessage id="steps.next" />
        </button>
      </Link>
    </div>
  );
};

const noop = () => null;

ThirdPillarSelectSources.defaultProps = {
  exchangeExistingUnits: false,
  futureContributionsFundIsin: '',
  targetFunds: [],
  loadingSourceFunds: false,
  loadingTargetFunds: false,
  exchangeableSourceFunds: null,
  onSelect: noop,
  nextPath: '',
};

ThirdPillarSelectSources.propTypes = {
  exchangeExistingUnits: Types.bool,
  futureContributionsFundIsin: Types.string,
  targetFunds: Types.arrayOf(Types.shape({})),
  loadingSourceFunds: Types.bool,
  loadingTargetFunds: Types.bool,
  exchangeableSourceFunds: Types.arrayOf(Types.shape({})),
  onSelect: Types.func,
  nextPath: Types.string,
};

const mapStateToProps = (state) => ({
  exchangeExistingUnits: state.thirdPillar.exchangeExistingUnits,
  exchangeableSourceFunds: state.thirdPillar.exchangeableSourceFunds,
  futureContributionsFundIsin: state.thirdPillar.selectedFutureContributionsFundIsin,
  targetFunds: state.thirdPillar.targetFunds,
  loadingSourceFunds: state.thirdPillar.loadingSourceFunds,
  loadingTargetFunds: state.thirdPillar.loadingTargetFunds,
  loading: state.login.loadingUser || state.login.loadingUserConversion,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      onSelect: selectThirdPillarSources,
    },
    dispatch,
  );

export default connect(mapStateToProps, mapDispatchToProps)(ThirdPillarSelectSources);
