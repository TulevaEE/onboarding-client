import React, { PropTypes as Types } from 'react';
import { Message } from 'retranslate';
import { connect } from 'react-redux';

import { utils } from '../../../common';

export const OldPensionFundList = ({ className, activeSourceFund, showAlternative, age }) => {
  if (!showAlternative) {
    return (
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
  }
  if (age < 55) {
    return (
      <ul className={className}>
        <li>
          <Message>new.user.flow.new.user.old.fund.young.age.recommendation</Message>
        </li>
        <li>
          <Message>new.user.flow.new.user.old.fund.below.55</Message>
          <strong><Message>target.funds.EE3600109435.title.into</Message></strong>
        </li>
      </ul>
    );
  }
  return (
    <ul className={className}>
      <li>
        <Message>new.user.flow.new.user.old.fund.low.fees</Message>
      </li>
    </ul>
  );
};

OldPensionFundList.defaultProps = {
  className: '',
  activeSourceFund: null,
  showAlternative: false,
  age: 18,
};

OldPensionFundList.propTypes = {
  className: Types.string,
  activeSourceFund: Types.shape({}),
  showAlternative: Types.bool,
  age: Types.number,
};

const mapStateToProps = state => ({
  activeSourceFund: utils.findWhere(state.exchange.sourceFunds || [],
    element => element.activeFund),
  age: (state.login.user || {}).age,
});

const connectToRedux = connect(mapStateToProps);

export default connectToRedux(OldPensionFundList);
