import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { Link, Redirect } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import { Loader, Radio } from '../../../common';
import { selectThirdPillarSources } from '../../../thirdPillar/actions';
import AccountStatement from '../../../account/AccountStatement';

// TODO: don't import from 2nd pillar flow
import TargetFundSelector from '../../secondPillar/selectSources/targetFundSelector';

export const ThirdPillarSelectSources = ({
  exchangeExistingUnits,
  futureContributionsFundIsin,
  loadingSourceFunds,
  loadingTargetFunds,
  sourceFunds,
  targetFunds,
  exchangeableSourceFunds,
  onSelect,
  nextPath,
}) => {
  const { formatMessage } = useIntl();

  const fullSelectionActive = !!exchangeExistingUnits && !!futureContributionsFundIsin;
  const someSelectionActive = !exchangeExistingUnits && !!futureContributionsFundIsin;
  const isValid = exchangeExistingUnits || futureContributionsFundIsin;
  const defaultTargetFund = targetFunds && targetFunds.length ? targetFunds[0] : {};

  return (
    <div>
      {!loadingSourceFunds && exchangeableSourceFunds && !exchangeableSourceFunds.length && (
        <Redirect to={nextPath} />
      )}
      <div className="row justify-content-around align-items-center">
        <div className="col-12">
          <div className="px-col mb-4">
            <p className="mb-4 lead">
              <FormattedMessage id="thirdPillarFlowSelectSources.title" />
            </p>
            {(loadingSourceFunds || !sourceFunds.length) && <Loader className="align-middle" />}
            {!loadingSourceFunds && exchangeableSourceFunds && !!exchangeableSourceFunds.length && (
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

            {(loadingTargetFunds || !targetFunds.length) && (
              <Loader className="align-middle mt-4" />
            )}
            {!loadingTargetFunds && !!targetFunds.length && (
              <TargetFundSelector
                targetFunds={targetFunds}
                onSelectFund={(targetFund) => onSelect(true, targetFund.isin)}
              />
            )}
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
  sourceFunds: [],
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
  sourceFunds: Types.arrayOf(Types.shape({})),
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
  sourceFunds: state.thirdPillar.sourceFunds,
  targetFunds: state.thirdPillar.targetFunds,
  loadingSourceFunds: state.thirdPillar.loadingSourceFunds,
  loadingTargetFunds: state.thirdPillar.loadingTargetFunds,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      onSelect: selectThirdPillarSources,
    },
    dispatch,
  );

export default connect(mapStateToProps, mapDispatchToProps)(ThirdPillarSelectSources);
