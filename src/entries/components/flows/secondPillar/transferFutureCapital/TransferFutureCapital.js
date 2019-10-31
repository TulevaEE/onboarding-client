import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Message, withTranslations } from 'retranslate';
import { Link } from 'react-router-dom';

import { Radio, Loader, InfoTooltip, utils } from '../../../common';
import TargetFundTooltipBody from './targetFundTooltipBody';
import { selectFutureContributionsFund } from '../../../exchange/actions';

const fundSelectStyles = {
  fontSize: '140%',
  height: '140%',
};

export const TransferFutureCapital = ({
  selectedFutureContributionsFundIsin,
  onSelectFutureCapitalFund,
  targetFunds,
  loadingTargetFunds,
  activeSourceFund,
  isUserConverted,
  translations: { translate },
}) => {
  if (loadingTargetFunds) {
    return <Loader className="align-middle" />;
  }
  const tulevaTargetFunds = targetFunds.filter(fund => (fund.fundManager || {}).name === 'Tuleva');
  const sortedTargetFunds = targetFunds
    .slice()
    .sort((fund1, fund2) => fund1.name.localeCompare(fund2.name));
  return (
    <div>
      <div className="px-col">
        <p className="lead m-0">
          <Message>transfer.future.capital.intro.choose</Message>
        </p>
      </div>

      <select
        style={fundSelectStyles}
        className="custom-select mt-4"
        onChange={event => onSelectFutureCapitalFund(event.target.value)}
        value={selectedFutureContributionsFundIsin || ''}
      >
        <option value="1" hidden="hidden">
          {translate('transfer.future.capital.other.fund')}
        </option>
        {sortedTargetFunds.map(fund => (
          <option value={fund.isin} key={fund.isin}>
            {fund.name}
          </option>
        ))}
      </select>

      {tulevaTargetFunds.map(fund => (
        <Radio
          key={fund.isin}
          id={`tv-transfer-future-capital-${fund.isin}`}
          name="tv-transfer-future-capital"
          selected={fund.isin === selectedFutureContributionsFundIsin}
          className="mt-4"
          onSelect={() => onSelectFutureCapitalFund(fund.isin)}
        >
          <h3 className="m-0">
            {fund.name}
            <InfoTooltip name={fund.isin}>
              <TargetFundTooltipBody targetFundIsin={fund.isin} />
            </InfoTooltip>
          </h3>
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
          <Message>transfer.future.capital.no</Message>
        </p>
        {!selectedFutureContributionsFundIsin && activeSourceFund ? (
          <p className="mb-0 mt-2">
            {isUserConverted ? (
              <Message
                params={{
                  currentFundName: activeSourceFund.name,
                  currentFundManagementFee: activeSourceFund.managementFeePercent,
                }}
              >
                transfer.future.capital.no.already.converted.subtitle
              </Message>
            ) : (
              <Message
                params={{
                  currentFundName: activeSourceFund.name,
                  currentFundManagementFee: activeSourceFund.managementFeePercent,
                }}
              >
                transfer.future.capital.no.subtitle
              </Message>
            )}
          </p>
        ) : (
          ''
        )}
      </Radio>
      <div className="mt-5">
        <Link className="btn btn-primary mb-2 mr-2" to="/2nd-pillar-flow/confirm-mandate">
          <Message>steps.next</Message>
        </Link>
        <Link className="btn btn-secondary mb-2" to="/2nd-pillar-flow/select-sources">
          <Message>steps.previous</Message>
        </Link>
      </div>
    </div>
  );
};

const noop = () => null;

TransferFutureCapital.defaultProps = {
  selectedFutureContributionsFundIsin: null,
  onSelectFutureCapitalFund: noop,
  targetFunds: [],
  loadingTargetFunds: false,
  activeSourceFund: null,
  isUserConverted: false,
};

TransferFutureCapital.propTypes = {
  selectedFutureContributionsFundIsin: Types.string,
  onSelectFutureCapitalFund: Types.func,
  targetFunds: Types.arrayOf(Types.shape({})),
  loadingTargetFunds: Types.bool,
  activeSourceFund: Types.shape({ name: Types.string, managementFeePercent: Types.number }),
  isUserConverted: Types.bool,
  translations: Types.shape({
    translate: Types.func.isRequired,
  }).isRequired,
};

const mapStateToProps = state => ({
  selectedFutureContributionsFundIsin: state.exchange.selectedFutureContributionsFundIsin,
  targetFunds: state.exchange.targetFunds,
  loadingTargetFunds: state.exchange.loadingTargetFunds,
  activeSourceFund: utils.findWhere(
    state.exchange.sourceFunds || [],
    element => element.activeFund,
  ),
  isUserConverted: state.login.userConversion.secondPillar.selectionComplete,
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      onSelectFutureCapitalFund: selectFutureContributionsFund,
    },
    dispatch,
  );

const translatedTransferFutureCapital = withTranslations(TransferFutureCapital);

const connectToRedux = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default connectToRedux(translatedTransferFutureCapital);
