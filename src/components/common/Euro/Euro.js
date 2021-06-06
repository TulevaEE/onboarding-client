import Types from 'prop-types';

import { formatAmountForCurrency } from '../utils';

const Euro = ({ amount }) => formatAmountForCurrency(amount);

Euro.propTypes = {
  amount: Types.number.isRequired,
};

export default Euro;
