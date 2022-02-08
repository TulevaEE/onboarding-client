import React from 'react';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';

export default () => (
  <div className="col">
    <p>
      <FormattedMessage id="confirm.mandate.not.filled.understand" />
    </p>
    <p>
      <FormattedMessage id="confirm.mandate.not.filled.cheapest" />
    </p>
    <p>
      <FormattedMessage id="confirm.mandate.not.filled.help" />
    </p>
    <ul>
      <li>
        <Link to="/2nd-pillar-flow/select-sources">
          <FormattedMessage id="confirm.mandate.not.filled.look.again" />
        </Link>
      </li>
      <li>
        <Link to="/account">
          <FormattedMessage id="confirm.mandate.not.filled.thinking" />
        </Link>
      </li>
    </ul>
  </div>
);
