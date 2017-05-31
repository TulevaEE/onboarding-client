import React, { PropTypes as Types } from 'react';
import { Message } from 'retranslate';

export const BringPensionToTulevaList = ({ className }) => (
  <ul className={className}>
    <li>
      <span>
        <span className="lead highlight">
          <Message>new.user.flow.new.user.cheapest</Message>
        </span>
        <Message>new.user.flow.new.user.cheapest.fund.management.fee</Message>
        <strong>0,34%</strong>
      </span>
    </li>
    <li><Message>new.user.flow.new.user.safety</Message></li>
    <li><Message>new.user.flow.new.user.money.to.self</Message></li>
  </ul>
);

BringPensionToTulevaList.defaultProps = {
  className: '',
};

BringPensionToTulevaList.propTypes = {
  className: Types.string,
};

export default BringPensionToTulevaList;
