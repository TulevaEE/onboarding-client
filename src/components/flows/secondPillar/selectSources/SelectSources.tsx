import React, { ReactNode, useState } from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect } from 'react-redux';

import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { selectExchangeSources, selectFutureContributionsFund } from '../../../exchange/actions';
import { ErrorMessage, Loader, Radio } from '../../../common';
import TargetFundSelector from './targetFundSelector';
import ExactFundSelector from './exactFundSelector';
import { isTuleva } from '../../../common/utils';
import AccountStatement from '../../../account/AccountStatement';
import { useMandateDeadlines } from '../../../common/apiHooks';
import { formatDateTime } from '../../../common/dateFormatter';
import { ErrorResponse, Fund, SourceFund } from '../../../common/apiModels';
import { SourceSelection } from '../../../exchange/types';
import { State } from '../../../../types';
import { isContributionsFundAlreadyActive } from '../../../exchange/reducer';

function selectAllWithTarget(
  sourceFunds: SourceFund[] | null,
  targetFund: Fund,
): SourceSelection[] {
  return (
    sourceFunds
      ?.filter((sourceFund, _, list) => list.length === 1 || sourceFund.isin !== targetFund?.isin)
      .map((fund) => ({
        sourceFundIsin: fund.isin,
        targetFundIsin: targetFund.isin,
        percentage: 1,
      })) || []
  );
}

function validate(selections: SourceSelection[] | null): string | null {
  const sourceFundPercentages: { [key: string]: number } = {};
  let errorDescriptionCode = null;
  selections?.forEach((selection) => {
    if (selection.sourceFundIsin && !sourceFundPercentages[selection.sourceFundIsin]) {
      sourceFundPercentages[selection.sourceFundIsin] = 0;
    }
    sourceFundPercentages[selection.sourceFundIsin] += selection.percentage;
    if (selection.sourceFundIsin && sourceFundPercentages[selection.sourceFundIsin] > 1) {
      errorDescriptionCode = 'select.sources.error.source.fund.percentages.over.100';
    }
    if (selection.sourceFundIsin && selection.sourceFundIsin === selection.targetFundIsin) {
      errorDescriptionCode = 'select.sources.error.source.fund.is.target.fund';
    }
  });

  return errorDescriptionCode;
}

enum SelectionActive {
  FULL_SELECTION = 'FULL_SELECTION',
  SOME_SELECTION = 'SOME_SELECTION',
}

export const SelectSources = ({
  loadingSourceFunds,
  loadingTargetFunds,
  sourceFunds,
  targetFunds,
  sourceSelection,
  onSelectExchangeSources,
  onSelectFutureContributionsFund,
  error,
  nextPath,
  selectedFutureContributionsFundIsin,
}: {
  loadingSourceFunds: boolean;
  loadingTargetFunds: boolean;
  sourceFunds: SourceFund[] | null;
  targetFunds: Fund[] | null;
  sourceSelection: SourceSelection[];
  onSelectExchangeSources: (selection: SourceSelection[], exact: boolean) => void;
  onSelectFutureContributionsFund: (fundIsin: string | null) => void;
  error: ErrorResponse | null;
  nextPath: string;
  selectedFutureContributionsFundIsin: string;
}) => {
  const { data: mandateDeadlines } = useMandateDeadlines();
  const [selectionActive, setSelectionActive] = useState<SelectionActive>(
    SelectionActive.FULL_SELECTION,
  );

  const [someExistingSwitch, setSomeExistingSwitch] = useState(
    sourceSelection && sourceSelection.length > 0,
  );
  const [someFutureSwitch, setSomeFutureSwitch] = useState(
    selectedFutureContributionsFundIsin != null,
  );

  React.useEffect(() => {
    setSomeFutureSwitch(selectedFutureContributionsFundIsin != null);
  }, [selectedFutureContributionsFundIsin]);

  React.useEffect(() => {
    setSomeExistingSwitch(sourceSelection && sourceSelection.length > 0);
  }, [sourceSelection]);

  const onSomeExistingSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSomeExistingSwitch(event.target.checked);
    onSelectExchangeSources(
      event.target.checked ? selectAllWithTarget(sourceFunds, defaultTargetFund) : [],
      true,
    );
  };

  const onSomeFutureSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSomeFutureSwitch(event.target.checked);
    const activeFund = sourceFunds?.find((fund) => fund.activeFund);
    const defaultTargetFund =
      activeFund?.isin !== tulevaTargetFunds[0].isin
        ? tulevaTargetFunds[0].isin
        : tulevaTargetFunds[1].isin;
    onSelectFutureContributionsFund(event.target.checked ? defaultTargetFund : null);
  };

  if (error) {
    return <ErrorMessage errors={error.body} />;
  }
  if (loadingSourceFunds || !sourceFunds || loadingTargetFunds || !targetFunds) {
    return <Loader className="align-middle" />;
  }
  const validationErrorCode = validate(sourceSelection);
  const isValid = !validationErrorCode;
  const tulevaTargetFunds = targetFunds?.filter((fund) => isTuleva(fund));
  const defaultTargetFund = tulevaTargetFunds[0];

  function validationSelectionErrorElement(errorCode: string | null): ReactNode {
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
        selected={selectionActive === SelectionActive.FULL_SELECTION}
        onSelect={() => setSelectionActive(SelectionActive.FULL_SELECTION)}
      >
        <h3 className="m-0">
          <FormattedMessage id="select.sources.select.all" />
        </h3>
        {selectionActive === SelectionActive.FULL_SELECTION ? (
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
                    b: (chunks: string) => <b className="text-nowrap">{chunks}</b>,
                  }}
                />
              )}
            </p>
            <FormattedMessage id="select.sources.select.all.choose" />
            <TargetFundSelector
              targetFunds={tulevaTargetFunds}
              onSelectFund={(targetFund: Fund) =>
                onSelectExchangeSources(selectAllWithTarget(sourceFunds, targetFund), false)
              }
              isSelected={(targetFund: Fund) =>
                JSON.stringify([...sourceSelection].sort()) ===
                  JSON.stringify(selectAllWithTarget(sourceFunds, targetFund).sort()) &&
                (targetFund.isin === selectedFutureContributionsFundIsin ||
                  (!selectedFutureContributionsFundIsin &&
                    isContributionsFundAlreadyActive(sourceFunds, targetFund.isin)))
              }
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
        selected={selectionActive === SelectionActive.SOME_SELECTION}
        onSelect={() => setSelectionActive(SelectionActive.SOME_SELECTION)}
      >
        <h3 className="m-0">
          <FormattedMessage id="select.sources.select.some" />
        </h3>
        {selectionActive === SelectionActive.SOME_SELECTION ? (
          <div className="mt-4">
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
                  onChange={(selection: SourceSelection[]) =>
                    onSelectExchangeSources(selection, true)
                  }
                />
                {validationSelectionErrorElement(validationErrorCode)}
              </>
            ) : (
              ''
            )}

            <hr className="my-3" />

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
                      <option value="1" hidden>
                        {message}
                      </option>
                    )}
                  </FormattedMessage>
                  {targetFunds.map((fund: Fund) => (
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

const mapStateToProps = (state: State) => ({
  sourceSelection: state.exchange.sourceSelection,
  sourceFunds: state.exchange.sourceFunds,
  targetFunds: state.exchange.targetFunds,
  loadingSourceFunds: state.exchange.loadingSourceFunds,
  loadingTargetFunds: state.exchange.loadingTargetFunds,
  error: state.exchange.error,
  selectedFutureContributionsFundIsin: state.exchange.selectedFutureContributionsFundIsin,
});

const mapDispatchToProps = (dispatch: Dispatch) =>
  bindActionCreators(
    {
      onSelectExchangeSources: selectExchangeSources,
      onSelectFutureContributionsFund: selectFutureContributionsFund,
    },
    dispatch,
  );

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(SelectSources);
