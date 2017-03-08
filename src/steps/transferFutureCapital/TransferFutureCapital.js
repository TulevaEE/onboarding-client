import React, { PropTypes as Types } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Message } from 'retranslate';
import { Link } from 'react-router';

import { Radio, Loader, InfoTooltip } from '../../common';
import TargetFundTooltipBody from '../selectTargetFund/targetFundTooltipBody';
import { selectTargetFund } from '../../exchange/actions';

export const TransferFutureCapital = ({
  selectedFutureContributionsFundIsin,
  onSelectFutureCapitalFund,
  targetFunds,
  loadingTargetFunds,
}) => {
  if (loadingTargetFunds) {
    return <Loader className="align-middle" />;
  }
  return (
    <div>
      <div className="px-col">
        <p className="lead m-0">
          <Message>transfer.future.capital.intro</Message>
          <br /><br />
          <Message>transfer.future.capital.intro.choose</Message>
        </p>
      </div>
      {
        targetFunds.map(fund => (
          <Radio
            key={fund.isin}
            name="tv-transfer-future-capital"
            selected={fund.isin === selectedFutureContributionsFundIsin}
            className="mt-4"
            onSelect={() => onSelectFutureCapitalFund(fund.isin)}
          >
            <h3 className="m-0">
              <Message>{`transfer.future.capital.${fund.isin}.fund`}</Message>
              <InfoTooltip name={fund.isin}>
                <TargetFundTooltipBody targetFundIsin={fund.isin} />
              </InfoTooltip>
            </h3>
          </Radio>
        ))
      }
      <Radio
        name="tv-transfer-future-capital"
        selected={!selectedFutureContributionsFundIsin}
        className="mt-4"
        onSelect={() => onSelectFutureCapitalFund(null)}
      >
        <p className="m-0"><Message>transfer.future.capital.no</Message></p>
      </Radio>
      <div className="px-col mt-5">
        <Link className="btn btn-primary mr-2" to="/steps/confirm-mandate">
          <Message>steps.next</Message>
        </Link>
        <Link className="btn btn-secondary" to="/steps/select-sources">
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
};

TransferFutureCapital.propTypes = {
  selectedFutureContributionsFundIsin: Types.string,
  onSelectFutureCapitalFund: Types.func,
  targetFunds: Types.arrayOf(Types.shape({})),
  loadingTargetFunds: Types.bool,
};

const mapStateToProps = state => ({
  selectedFutureContributionsFundIsin: state.exchange.selectedTargetFund,
  targetFunds: state.exchange.targetFunds,
  loadingTargetFunds: state.exchange.loadingTargetFunds,
});

const mapDispatchToProps = dispatch => bindActionCreators({
  onSelectFutureCapitalFund: selectTargetFund,
}, dispatch);

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(TransferFutureCapital);
