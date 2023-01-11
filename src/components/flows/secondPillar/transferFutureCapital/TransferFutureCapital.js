import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link, Redirect } from 'react-router-dom';

import { FormattedMessage, useIntl } from 'react-intl';
import { Loader, Radio, utils } from '../../../common';
import { selectFutureContributionsFund } from '../../../exchange/actions';
import { isTuleva } from '../../../common/utils';

const fundSelectStyles = {
  fontSize: '140%',
  height: '140%',
};

function isSkippingStepNecessary(sourceSelectionExact, sourceSelection) {
  return !sourceSelectionExact && sourceSelection.length > 0;
}

export const TransferFutureCapital = ({
  selectedFutureContributionsFundIsin,
  onSelectFutureCapitalFund,
  targetFunds,
  loading,
  activeSourceFund,
  isUserConverted,
  sourceSelection,
  sourceSelectionExact,
  previousPath,
  nextPath,
}) => {
  const { formatMessage } = useIntl();

  if (loading) {
    return <Loader className="align-middle" />;
  }
  const tulevaTargetFunds = targetFunds.filter((fund) => isTuleva(fund));
  const sortedTargetFunds = targetFunds
    .slice()
    .sort((fund1, fund2) => fund1.name.localeCompare(fund2.name));

  return (
    <div>
      {isSkippingStepNecessary(sourceSelectionExact, sourceSelection) && <Redirect to={nextPath} />}
      <div className="px-col">
        <p className="lead m-0">
          <FormattedMessage id="transfer.future.capital.intro.choose" />
        </p>
      </div>

      <select
        style={fundSelectStyles}
        className="custom-select mt-4"
        onChange={(event) => onSelectFutureCapitalFund(event.target.value)}
        value={selectedFutureContributionsFundIsin || ''}
      >
        <option value="1" hidden="hidden">
          {formatMessage({ id: 'transfer.future.capital.other.fund' })}
        </option>
        {sortedTargetFunds.map((fund) => (
          <option value={fund.isin} key={fund.isin}>
            {fund.name}
          </option>
        ))}
      </select>

      {tulevaTargetFunds.map((fund) => (
        <Radio
          key={fund.isin}
          id={`tv-transfer-future-capital-${fund.isin}`}
          name="tv-transfer-future-capital"
          selected={fund.isin === selectedFutureContributionsFundIsin}
          className="mt-4"
          onSelect={() => onSelectFutureCapitalFund(fund.isin)}
        >
          <h3 className="m-0">{fund.name}</h3>
        </Radio>
      ))}

      <Radio
        name="tv-transfer-future-capital"
        id="tv-transfer-future-capital-none"
        selected={!selectedFutureContributionsFundIsin}
        className="mt-4"
        onSelect={() => onSelectFutureCapitalFund(null)}
      >
        <p className={`m-0 ${!selectedFutureContributionsFundIsin ? 'text-bold' : ''}`}>
          <FormattedMessage id="transfer.future.capital.no" />
        </p>
        {!selectedFutureContributionsFundIsin && activeSourceFund ? (
          <p className="mb-0 mt-2">
            <FormattedMessage
              id={
                isUserConverted
                  ? 'transfer.future.capital.no.already.converted.subtitle'
                  : 'transfer.future.capital.no.subtitle'
              }
              values={{
                currentFundName: activeSourceFund.name,
                currentFundManagementFee: activeSourceFund.managementFeePercent,
              }}
            />
          </p>
        ) : (
          ''
        )}
      </Radio>
      <div className="mt-5">
        <Link className="btn btn-primary mb-2 mr-2" to={nextPath}>
          <FormattedMessage id="steps.next" />
        </Link>
        <Link className="btn btn-secondary mb-2" to={previousPath}>
          <FormattedMessage id="steps.previous" />
        </Link>
      </div>
    </div>
  );
};

TransferFutureCapital.defaultProps = {
  selectedFutureContributionsFundIsin: null,
  targetFunds: [],
  loading: false,
  activeSourceFund: null,
  isUserConverted: false,
  sourceSelection: [],
  sourceSelectionExact: false,
};

TransferFutureCapital.propTypes = {
  selectedFutureContributionsFundIsin: Types.string,
  targetFunds: Types.arrayOf(Types.shape({})),
  loading: Types.bool,
  activeSourceFund: Types.shape({
    name: Types.string,
    managementFeePercent: Types.number,
  }),
  isUserConverted: Types.bool,
  sourceSelection: Types.arrayOf(Types.shape({ targetFundIsin: Types.string })),
  sourceSelectionExact: Types.bool,
  previousPath: Types.string.isRequired,
  nextPath: Types.string.isRequired,
};

const mapStateToProps = (state) => ({
  selectedFutureContributionsFundIsin: state.exchange.selectedFutureContributionsFundIsin,
  targetFunds: state.exchange.targetFunds || [],
  loading:
    state.login.loadingUser ||
    state.login.loadingUserConversion ||
    state.exchange.loadingSourceFunds ||
    state.exchange.loadingTargetFunds,
  activeSourceFund: utils.findWhere(
    state.exchange.sourceFunds || [],
    (element) => element.activeFund,
  ),
  sourceSelection: state.exchange.sourceSelection,
  sourceSelectionExact: state.exchange.sourceSelectionExact,
  isUserConverted:
    state.login.userConversion && state.login.userConversion.secondPillar.selectionComplete,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      onSelectFutureCapitalFund: selectFutureContributionsFund,
    },
    dispatch,
  );

export default connect(mapStateToProps, mapDispatchToProps)(TransferFutureCapital);
