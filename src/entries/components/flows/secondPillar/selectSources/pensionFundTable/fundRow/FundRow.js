import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { Message } from 'retranslate';

import Euro from '../../../../../common/Euro';

const FundRow = ({ price, name, highlighted, active }) => {
  const displayName = <Message>{name}</Message>;
  const displayPrice = <Euro amount={price} />;
  return (
    <div className="row tv-table__row py-2">
      <div className="col-12 col-sm">
        {highlighted ? <b>{displayName}</b> : displayName}
        {active ? '*' : ''}
      </div>
      <div className="col-12 col-sm text-sm-right">
        {highlighted ? <b>{displayPrice}</b> : displayPrice}
      </div>
      {/*
        <div className="col-12 col-sm text-sm-right">TODO</div>
         */}
    </div>
  );
};

FundRow.defaultProps = {
  price: 0,
  name: '',
  highlighted: false,
  active: false,
};

FundRow.propTypes = {
  price: Types.number,
  name: Types.oneOfType([Types.node, Types.string]),
  highlighted: Types.bool,
  active: Types.bool,
};

export default FundRow;
