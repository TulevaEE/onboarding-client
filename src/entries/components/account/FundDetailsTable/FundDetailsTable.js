import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { PropTypes as Types } from 'prop-types';
import { Message } from 'retranslate';
import './FundDetails.scss';
import { formatAmountForCurrency } from '../../common/utils';
import { calculateTotals } from './fundCalculations';
import Table from '../../common/table/Table';

const FundDetailsTable = ({ allFunds, pillar }) => {
  const funds = allFunds.filter(fund => fund.pillar === pillar);
  const totalsOfPillars = calculateTotals(funds);

  const titleKeysForPillars = {
    2: 'overview.title.pillar.2',
    3: 'overview.title.pillar.3',
  };

  return (
    funds &&
    funds.length > 0 && (
      <Fragment>
        <div className="row">
          <div className="col-md-6 mt-5">
            <Message className="mb-2 lead h5">{titleKeysForPillars[pillar]}</Message>
          </div>
          {pillar === 2 && (
            <div className="col-md-6 mt-5 text-md-right">
              <Link className="btn btn-primary mb-3" to="/2nd-pillar-flow">
                <Message>change.my.pension.fund</Message>
              </Link>
            </div>
          )}
        </div>
        <Table>
          <thead>
            <tr>
              <th>
                <Message>overview.table.header.instrument</Message>
              </th>
              <th>
                <Message>overview.table.header.value</Message>
              </th>
            </tr>
          </thead>
          <tbody>
            {funds &&
              funds.map(fund => (
                <tr key={fund.isin}>
                  <td>{fund.name + (fund.activeFund ? '*' : '')}</td>
                  <td>{formatAmountForCurrency(fund.price)}</td>
                </tr>
              ))}
          </tbody>
          <tfoot>
            <tr>
              <td>
                <Message>overview.total</Message>
              </td>
              <td>{formatAmountForCurrency(totalsOfPillars.value)}</td>
            </tr>
          </tfoot>
        </Table>
      </Fragment>
    )
  );
};

FundDetailsTable.defaultProps = {
  allFunds: [],
  pillar: '2',
};

FundDetailsTable.propTypes = {
  allFunds: Types.arrayOf(
    Types.shape({
      price: Types.number,
      currency: Types.string,
      name: Types.string,
      manager: Types.string,
      isin: Types.string,
      activeFund: Types.bool,
      pillar: Types.number,
    }),
  ),
  pillar: Types.number,
};

export default FundDetailsTable;
