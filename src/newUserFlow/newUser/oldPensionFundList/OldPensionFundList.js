import React, { PropTypes as Types } from 'react';
import { Message } from 'retranslate';
import { connect } from 'react-redux';

import { utils } from '../../../common';

export const OldPensionFundList = ({ className, activeSourceFund }) => (
  <ul className={className}>
    <li>
      <Message>new.user.flow.new.user.old.fund.management.fee</Message>
      <span className="red">{activeSourceFund.managementFeePercent.split('.').join(',')}%</span>
      <span>
        <Message>new.user.flow.new.user.old.fund.management.fee.yearly</Message>
      </span>
    </li>
  </ul>
);

OldPensionFundList.defaultProps = {
  className: '',
  activeSourceFund: null,
};

OldPensionFundList.propTypes = {
  className: Types.string,
  activeSourceFund: Types.shape({}),
};

const mapStateToProps = state => ({
  activeSourceFund: utils.findWhere(state.exchange.sourceFunds || [],
    element => element.activeFund),
});

const connectToRedux = connect(mapStateToProps);

export default connectToRedux(OldPensionFundList);
