import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { Message } from 'retranslate';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { Link, Redirect } from 'react-router-dom';
import { Loader, Radio } from '../../../common';
import { selectThirdPillarSources } from '../../../thirdPillar/actions';
import { TULEVA_3RD_PILLAR_FUND_ISIN } from '../../../thirdPillar/initialState';

// TODO: don't import from 2nd pillar flow
import PensionFundTable from '../../secondPillar/selectSources/pensionFundTable';
import TargetFundSelector from '../../secondPillar/selectSources/targetFundSelector';

export const ThirdPillarSelectSources = ({
  recommendedFundIsin,
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
  const fullSelectionActive = !!exchangeExistingUnits && !!futureContributionsFundIsin;
  const someSelectionActive = !exchangeExistingUnits && !!futureContributionsFundIsin;
  const isValid = exchangeExistingUnits || futureContributionsFundIsin;
  const defaultTargetFund = targetFunds && targetFunds.length ? targetFunds[0] : null;
  return (
    <div>
      {!loadingSourceFunds && exchangeableSourceFunds && !exchangeableSourceFunds.length && (
        <Redirect to={nextPath} />
      )}
      <div className="row justify-content-around align-items-center">
        <div className="col-12">
          <div className="px-col mb-4">
            <p className="mb-4 lead">
              <Message>thirdPillarFlowSelectSources.title</Message>
            </p>
            {(loadingSourceFunds || !sourceFunds.length) && <Loader className="align-middle" />}
            {!loadingSourceFunds && exchangeableSourceFunds && !!exchangeableSourceFunds.length && (
              <PensionFundTable funds={exchangeableSourceFunds} />
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
          <Message>thirdPillarFlowSelectSources.selectAll.title</Message>
        </h3>
        {fullSelectionActive ? (
          <div className="mt-3">
            <Message>thirdPillarFlowSelectSources.selectAll.subtitle</Message>{' '}
            <a
              href="//www.pensionikeskus.ee/iii-sammas/vabatahtlikud-pensionifondid/fonditasude-vordlus-pensioni-iii-sammas/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Message>thirdPillarFlowSelectSources.cost</Message>
            </a>
            {(loadingTargetFunds || !targetFunds.length) && (
              <Loader className="align-middle mt-4" />
            )}
            {!loadingTargetFunds && !!targetFunds.length && (
              <TargetFundSelector
                targetFunds={targetFunds}
                onSelectFund={targetFund => onSelect(true, targetFund.isin)}
                recommendedFundIsin={recommendedFundIsin}
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
          <Message>thirdPillarFlowSelectSources.futureContributions.title</Message>
        </h3>
        {someSelectionActive ? (
          <div className="mt-3">
            <Message>thirdPillarFlowSelectSources.futureContributions.subtitle</Message>
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
          <Message>steps.next</Message>
        </button>
      </Link>
    </div>
  );
};

const noop = () => null;

ThirdPillarSelectSources.defaultProps = {
  recommendedFundIsin: '',
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
  recommendedFundIsin: Types.string,
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

const mapStateToProps = state => ({
  recommendedFundIsin: (state.login.user || {}).age < 55 ? TULEVA_3RD_PILLAR_FUND_ISIN : '',
  exchangeExistingUnits: state.thirdPillar.exchangeExistingUnits,
  exchangeableSourceFunds: state.thirdPillar.exchangeableSourceFunds,
  futureContributionsFundIsin: state.thirdPillar.selectedFutureContributionsFundIsin,
  sourceFunds: state.thirdPillar.sourceFunds,
  targetFunds: state.thirdPillar.targetFunds,
  loadingSourceFunds: state.thirdPillar.loadingSourceFunds,
  loadingTargetFunds: state.thirdPillar.loadingTargetFunds,
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      onSelect: selectThirdPillarSources,
    },
    dispatch,
  );

const connectToRedux = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default connectToRedux(ThirdPillarSelectSources);
