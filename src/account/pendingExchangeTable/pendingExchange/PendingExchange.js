import React, { PropTypes as Types } from 'react';
import { Message } from 'retranslate';

const PendingExchange = ({ amount,
                           date,
                           sourceFund,
                           targetFund,
                         }) => (
                           <div className="row tv-table__row py-2">
                             <div className="col-12 col-sm">
                               <Message>{sourceFund.name}</Message>
                             </div>
                             <div className="col-12 col-sm">
                               <Message>{targetFund.name}</Message>
                             </div>
                             <div className="col-12 col-sm">
                               <Message>
                                 {new Date(date).getFullYear()}-
                                 {new Date(date).getMonth()}-
                                 {new Date(date).getDate()}
                               </Message>
                             </div>
                             <div className="col-12 col-sm text-sm-right">
                               <Message>{Math.round(amount * 100)}</Message>%
                             </div>
                           </div>
  );

PendingExchange.defaultProps = {
  amount: 0,
  date: null,
  sourceFund: null,
  targetFund: null,

};

PendingExchange.propTypes = {
  amount: Types.number,
  date: Types.string,
  sourceFund: Types.shape({}),
  targetFund: Types.shape({}),
};

export default PendingExchange;
