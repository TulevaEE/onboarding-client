import React, { useState } from 'react';
import { PropTypes as Types } from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { Link, Redirect } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { selectExchangeSources, selectFutureContributionsFund } from '../../../exchange/actions';
import { ErrorMessage, Loader, Radio } from '../../../common';
import TargetFundSelector from './targetFundSelector';
import ExactFundSelector from './exactFundSelector';
import { isTuleva } from '../../../common/utils';
import AccountStatement from '../../../account/AccountStatement';
import { useMandateDeadlines } from '../../../common/apiHooks';
import { formatDateTime } from '../../../common/dateFormatter';

function selectAllWithTarget(sourceFunds, targetFund) {
  return sourceFunds
    .filter((fund, index, list) => list.length === 1 || fund.isin !== targetFund.isin)
    .map((fund) => ({
      sourceFundIsin: fund.isin,
      targetFundIsin: targetFund.isin,
      percentage: 1,
    }));
}

function selectionsError(selections) {
  const sourceFundPercentages = {};
  let errorDescriptionCode = null;
  selections.forEach((selection) => {
    if (!sourceFundPercentages[selection.sourceFundIsin]) {
      sourceFundPercentages[selection.sourceFundIsin] = 0;
    }
    sourceFundPercentages[selection.sourceFundIsin] += selection.percentage;
    if (sourceFundPercentages[selection.sourceFundIsin] > 1) {
      errorDescriptionCode = 'select.sources.error.source.fund.percentages.over.100';
    }

    if (selection.sourceFundIsin === selection.targetFundIsin) {
      errorDescriptionCode = 'select.sources.error.source.fund.is.target.fund';
    }
  });

  return errorDescriptionCode;
}

export const SelectSources = ({
  loadingSourceFunds,
  loadingTargetFunds,
  sourceFunds,
  targetFunds,
  sourceSelection,
  onSelectExchangeSources,
  onSelectFutureContributionsFund,
  sourceSelectionExact,
  error,
  nextPath,
  selectedFutureContributionsFundIsin,
}) => {
  const { data: mandateDeadlines } = useMandateDeadlines();
  const [someExistingSwitch, setSomeExistingSwitch] = useState(
    sourceSelection && sourceSelection.length > 0,
  );
  const [someFutureSwitch, setSomeFutureSwitch] = useState(
    selectedFutureContributionsFundIsin != null,
  );

  const onSomeExistingSwitchChange = (event) => {
    setSomeExistingSwitch(event.target.checked);
    onSelectExchangeSources([], true);
  };

  const onSomeFutureSwitchChange = (event) => {
    setSomeFutureSwitch(event.target.checked);
    onSelectFutureContributionsFund(null);
  };

  if (error) {
    return <ErrorMessage errors={error.body} />;
  }
  if (loadingSourceFunds || !sourceFunds || loadingTargetFunds || !targetFunds) {
    return <Loader className="align-middle" />;
  }
  const fullSelectionActive = !!sourceSelection.length && !sourceSelectionExact;
  const futureSelectionActive =
    !sourceSelection.length && !sourceSelectionExact && targetFunds && targetFunds.length;
  const validationErrorCode =
    sourceSelectionExact === true ? selectionsError(sourceSelection) : null;
  const isValid = !validationErrorCode;
  const tulevaTargetFunds =
    targetFunds && targetFunds.length && targetFunds.filter((fund) => isTuleva(fund));
  const defaultTargetFund =
    tulevaTargetFunds && tulevaTargetFunds.length ? tulevaTargetFunds[0] : null;

  function validationSelectionErrorElement(errorCode) {
    if (!errorCode) {
      return null;
    }
    return (
      <div className="text-danger mt-3">
        <FormattedMessage id={errorCode} />
      </div>
    );
  }

  return (
    <div>
      {sourceFunds && !sourceFunds.length && <Redirect to={nextPath} />}
      <div className="row">
        <div className="col-12">
          <div className="mb-4">
            <p>
              <FormattedMessage id="select.sources.intro" />
            </p>
            <p>
              <FormattedMessage id="select.sources.current.status" />
            </p>
            <AccountStatement
              funds={sourceFunds}
              activeFundNotice={<FormattedMessage id="select.sources.active.fund" />}
            />
          </div>
        </div>
      </div>
      <Radio
        name="tv-select-sources-type"
        id="tv-select-sources-type-all"
        selected={fullSelectionActive}
        onSelect={() =>
          onSelectExchangeSources(selectAllWithTarget(sourceFunds, defaultTargetFund), false)
        }
      >
        <h3 className="m-0">
          <FormattedMessage id="select.sources.select.all" />
        </h3>
        {fullSelectionActive ? (
          <div className="mt-3">
            <p>
              <FormattedMessage id="select.sources.select.all.subtitle" />
            </p>
            <p>
              {mandateDeadlines && (
                <FormattedMessage
                  id="select.sources.select.all.deadline"
                  values={{
                    periodEnding: formatDateTime(mandateDeadlines.periodEnding),
                    b: (chunks) => <b className="text-nowrap">{chunks}</b>,
                  }}
                />
              )}
            </p>
            <FormattedMessage id="select.sources.select.all.choose" />
            <TargetFundSelector
              targetFunds={tulevaTargetFunds}
              onSelectFund={(targetFund) =>
                onSelectExchangeSources(selectAllWithTarget(sourceFunds, targetFund), false)
              }
              selectedTargetFundIsin={sourceSelection[0].targetFundIsin}
            />
          </div>
        ) : (
          ''
        )}
      </Radio>
      <Radio
        name="tv-select-sources-type"
        id="tv-select-sources-type-future"
        className="mt-3"
        selected={futureSelectionActive}
        onSelect={() => onSelectExchangeSources([], false)}
      >
        <h3 className="m-0">
          <FormattedMessage id="select.sources.select.future" />
        </h3>
        {futureSelectionActive ? (
          <>
            <p className="mt-3">
              <FormattedMessage id="select.sources.select.future.subtitle" />
            </p>
            <p>
              <FormattedMessage id="select.sources.select.all.choose" />
            </p>
            <TargetFundSelector
              targetFunds={tulevaTargetFunds}
              onSelectFund={(fund) => onSelectFutureContributionsFund(fund.isin)}
              selectedTargetFundIsin={selectedFutureContributionsFundIsin}
            />
          </>
        ) : (
          ''
        )}
      </Radio>
      <Radio
        name="tv-select-sources-type"
        id="tv-select-sources-type-some"
        className="mt-3"
        selected={sourceSelectionExact}
        onSelect={() => onSelectExchangeSources(sourceSelection, true)}
      >
        <p className="m-0">
          <FormattedMessage id="select.sources.select.some" />
        </p>
        {sourceSelectionExact ? (
          <div className="mt-3">
            <hr className="mb-3" />

            <div className="custom-control custom-switch">
              <input
                type="checkbox"
                className="custom-control-input"
                id="someExistingSwitch"
                onChange={onSomeExistingSwitchChange}
                checked={someExistingSwitch}
              />
              <label className="custom-control-label text-bold" htmlFor="someExistingSwitch">
                <FormattedMessage id="select.sources.select.some.existing" />
              </label>
            </div>

            {someExistingSwitch ? (
              <>
                <ExactFundSelector
                  selections={sourceSelection}
                  sourceFunds={sourceFunds}
                  targetFunds={targetFunds}
                  onChange={(selection) => onSelectExchangeSources(selection, true)}
                />
                {validationSelectionErrorElement(validationErrorCode)}
              </>
            ) : (
              ''
            )}

            <hr className="mt-4 mb-3" />

            <div className="custom-control custom-switch">
              <input
                type="checkbox"
                className="custom-control-input"
                id="someFutureSwitch"
                onChange={onSomeFutureSwitchChange}
                checked={someFutureSwitch}
              />
              <label className="custom-control-label text-bold" htmlFor="someFutureSwitch">
                <FormattedMessage id="select.sources.select.some.future" />
              </label>
            </div>

            {someFutureSwitch ? (
              <>
                <select
                  className="custom-select mt-3"
                  onChange={(event) => onSelectFutureContributionsFund(event.target.value)}
                  value={selectedFutureContributionsFundIsin || ''}
                >
                  <FormattedMessage id="transfer.future.capital.other.fund">
                    {(message) => (
                      <option value="1" hidden="hidden">
                        {message}
                      </option>
                    )}
                  </FormattedMessage>
                  {targetFunds.map((fund) => (
                    <option value={fund.isin} key={fund.isin}>
                      {fund.name}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              ''
            )}
          </div>
        ) : (
          ''
        )}
      </Radio>

      <Link id="nextStep" to={isValid ? nextPath : '#'}>
        <button type="button" className={`btn btn-primary mt-5 ${!isValid ? 'disabled' : ''}`}>
          <FormattedMessage id="steps.next" />
        </button>
      </Link>
    </div>
  );
};

const noop = () => null;

SelectSources.defaultProps = {
  sourceFunds: null,
  targetFunds: null,
  loadingSourceFunds: false,
  loadingTargetFunds: false,
  sourceSelection: [],
  sourceSelectionExact: false,
  onSelectExchangeSources: noop,
  onSelectFutureContributionsFund: noop,
  error: null,
  selectedFutureContributionsFundIsin: null,
};

SelectSources.propTypes = {
  sourceSelection: Types.arrayOf(Types.shape({ targetFundIsin: Types.string })),
  sourceSelectionExact: Types.bool,
  sourceFunds: Types.arrayOf(Types.shape({})),
  targetFunds: Types.arrayOf(Types.shape({})),
  loadingSourceFunds: Types.bool,
  loadingTargetFunds: Types.bool,
  onSelectExchangeSources: Types.func,
  onSelectFutureContributionsFund: Types.func,
  error: Types.shape({ body: Types.string }),
  nextPath: Types.string.isRequired,
  selectedFutureContributionsFundIsin: Types.string,
};

const mapStateToProps = (state) => ({
  sourceSelection: state.exchange.sourceSelection,
  sourceSelectionExact: state.exchange.sourceSelectionExact,
  sourceFunds: state.exchange.sourceFunds,
  targetFunds: state.exchange.targetFunds,
  loadingSourceFunds: state.exchange.loadingSourceFunds,
  loadingTargetFunds: state.exchange.loadingTargetFunds,
  error: state.exchange.error,
  selectedFutureContributionsFundIsin: state.exchange.selectedFutureContributionsFundIsin,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      onSelectExchangeSources: selectExchangeSources,
      onSelectFutureContributionsFund: selectFutureContributionsFund,
    },
    dispatch,
  );

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(SelectSources);
