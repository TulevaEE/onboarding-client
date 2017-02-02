import React, { PropTypes as Types } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Message } from 'retranslate';
import { Link } from 'react-router';

import { Loader, Radio } from '../../common';
import { selectTargetFund } from '../../exchange/actions';

export const SelectTargetFund = ({
  targetFunds,
  loadingTargetFunds,
  selectedTargetFund,
  onSelectTargetFund,
}) => {
  if (loadingTargetFunds) {
    return <Loader className="align-middle" />;
  }
  return (
    <div>
      {
        targetFunds.map((fund, index) => (
          <Radio
            key={fund.isin}
            name="tv-select-target-fund"
            selected={selectedTargetFund && selectedTargetFund.isin === fund.isin}
            onSelect={() => onSelectTargetFund(fund)}
            className={index !== 0 ? 'mt-2' : ''}
          >
            <h3><Message>{`target.funds.${fund.isin}.title`}</Message></h3>
            <Message>{`target.funds.${fund.isin}.description`}</Message>
          </Radio>
        ))
      }
      <div className="px-col mt-4">
        <Link className="btn btn-primary mr-2" to="/steps/transfer-future-capital">
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

SelectTargetFund.defaultProps = {
  targetFunds: [],
  loadingTargetFunds: false,
  selectedTargetFund: null,
  onSelectTargetFund: noop,
};

SelectTargetFund.propTypes = {
  targetFunds: Types.arrayOf(Types.shape({ isin: Types.string })),
  selectedTargetFund: Types.shape({ isin: Types.string }),
  loadingTargetFunds: Types.bool,
  onSelectTargetFund: Types.func,
};

const mapStateToProps = state => ({
  targetFunds: state.exchange.targetFunds,
  loadingTargetFunds: state.exchange.loadingTargetFunds,
  selectedTargetFund: state.exchange.selectedTargetFund,
});

const mapDispatchToProps = dispatch => bindActionCreators({
  onSelectTargetFund: selectTargetFund,
}, dispatch);

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(SelectTargetFund);
