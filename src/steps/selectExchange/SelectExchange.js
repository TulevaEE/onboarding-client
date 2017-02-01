import React from 'react';
import { Message } from 'retranslate';
import { Link } from 'react-router';

const SelectExchange = () => (
  <div>
    <div>This will become SelectExchange</div>
    <Link className="btn btn-primary mt-4 mb-4" to="/steps/select-fund">
      <Message>steps.next</Message>
    </Link>
    <br />
    <small className="text-muted">
      <Message>select.exchange.calculation.info</Message>
    </small>
  </div>
);

export default SelectExchange;
