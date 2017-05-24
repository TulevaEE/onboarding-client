import React, { PropTypes as Types } from 'react';
import { Message } from 'retranslate';

const PendingExchange = ({ amount,
                           date,
                           sourceFundIsin,
                           targetFundIsin,
                         }) => (
                           <div className="row tv-table__row py-2">
                             <div className="col-12 col-sm">
                               <Message>{sourceFundIsin}</Message>
                             </div>
                             <div className="col-12 col-sm">
                               <Message>{targetFundIsin}</Message>
                             </div>
                             <div className="col-12 col-sm">
                               <Message>
                                 {new Date(date).getFullYear()}-
                                 {new Date(date).getMonth()}-
                                 {new Date(date).getDate()}
                               </Message>
                             </div>
                             <div className="col-12 col-sm text-sm-right">
                               <Message>{Math.round(amount * 100)} %</Message>
                             </div>
                           </div>
  );

PendingExchange.defaultProps = {
  amount: 0,
  date: null,
  sourceFundIsin: null,
  targetFundIsin: null,

};

PendingExchange.propTypes = {
  amount: Types.number,
  date: Types.string,
  sourceFundIsin: Types.string,
  targetFundIsin: Types.string,
};

export default PendingExchange;
