import React, { PropTypes as Types } from 'react';
import { Message } from 'retranslate';

import { Loader } from '../../common';
import PensionFundOverview from './pensionFundOverview';

const CurrentBalance = ({ funds, loading }) => (
  <div>
    <h3><Message>account.current.balance.title</Message></h3>
    <p>
      <Message>account.current.balance.subtitle</Message>
      <a
        target="_blank"
        rel="noopener noreferrer"
        href="https://www.e-register.ee/"
      >
        <Message>account.current.balance.evk</Message>
      </a>
    </p>
    {
      loading ? <Loader className="align-middle" /> : <PensionFundOverview funds={funds} />
    }
  </div>
);

CurrentBalance.defaultProps = {
  funds: [],
  loading: false,
};

CurrentBalance.propTypes = {
  funds: Types.arrayOf(Types.shape({})),
  loading: Types.bool,
};

export default CurrentBalance;
