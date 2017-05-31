import React, { PropTypes as Types } from 'react';
import { connect } from 'react-redux';
import { Message } from 'retranslate';
import { formatLargeAmountForCurrency } from '../../../common/utils';

export const JoinTulevaList = ({ className, comparison, comparisonBonus }) => (
  <ul className={className}>

    <li><Message>new.user.flow.new.user.tuleva.owner</Message></li>
    <li><Message>new.user.flow.new.user.member.bonus.start</Message>
      <span className="lead highlight">
        {formatLargeAmountForCurrency(comparison.newFundFee - comparisonBonus.newFundFee)}
      </span>
      <span><Message>new.user.flow.new.user.member.bonus.end</Message></span>
    </li>
    <li><Message>new.user.flow.new.user.profit.sharing</Message></li>
    <li>
      <Message>new.user.flow.new.user.improve.the.pension.system</Message>
    </li>

  </ul>
);

JoinTulevaList.defaultProps = {
  className: '',
  comparison: {},
  comparisonBonus: {},
};

JoinTulevaList.propTypes = {
  className: Types.string,
  comparison: Types.shape({}),
  comparisonBonus: Types.shape({}),
};

const mapStateToProps = state => ({
  comparison: (state.comparison || {}).comparison || {},
  comparisonBonus: (state.comparison || {}).comparisonBonus || {},
});

const connectToRedux = connect(mapStateToProps);

export default connectToRedux(JoinTulevaList);
