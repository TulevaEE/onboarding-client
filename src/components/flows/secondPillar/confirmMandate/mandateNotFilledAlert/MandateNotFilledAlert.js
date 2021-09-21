import React from 'react';
import { Link } from 'react-router-dom';
import { Message } from 'retranslate';

const MandateNotFilledAlert = () => (
  <div className="col">
    <p>
      <Message>confirm.mandate.not.filled.understand</Message>
    </p>
    <p>
      <Message>confirm.mandate.not.filled.cheapest</Message>
    </p>
    <p>
      <Message>confirm.mandate.not.filled.help</Message>
    </p>
    <ul>
      <li>
        <Link to="/2nd-pillar-flow/select-sources">
          <Message>confirm.mandate.not.filled.look.again</Message>
        </Link>
      </li>
      <li>
        <Link to="/account">
          <Message>confirm.mandate.not.filled.thinking</Message>
        </Link>
      </li>
    </ul>
  </div>
);

export default MandateNotFilledAlert;
