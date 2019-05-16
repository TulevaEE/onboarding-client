import React, { Fragment } from 'react';
import { PropTypes as Types } from 'prop-types';
import { Message } from 'retranslate';
import './FundDetails.scss';
import { getProfitClassName, formatAmountForCurrency } from '../../common/utils';
import { calculateTotals, getSumOfPillars } from './fundCalculations';
import Table from '../../common/table/Table';

const FundDetailsTable = ({ allFunds, pillar }) => {
  const funds = allFunds.filter(fund => fund.pillar === pillar);
  const groupedPillars = getSumOfPillars(funds);
  const totalsOfPillars = calculateTotals(groupedPillars);

  if (funds === undefined || funds.length === 0) {
    return <div />;
  }
  return (
    <Fragment>
      <div className="row col-md-6 mt-4">
        {pillar === 2 ? (
          <Message className="mb-4 lead h5">overview.title.pillar.2</Message>
        ) : (
          <Message className="mb-4 lead h5">overview.title.pillar.3</Message>
        )}
      </div>

      <Table>
        <thead>
          <tr>
            <th>
              <Message>overview.summary.table.header.instrument</Message>
            </th>
            <th>
              <Message>overview.summary.table.header.contributions</Message>
            </th>
            <th>
              <Message>overview.summary.table.header.profit</Message>
            </th>
            <th>
              <Message>overview.summary.table.header.value</Message>
            </th>
          </tr>
        </thead>
        <tbody>
          {funds &&
            funds.map(fund => (
              <tr key={fund.pillar}>
                <td>{fund.name + (fund.activeFund ? '*' : '')}</td>
                <td>{formatAmountForCurrency(fund.contributionSum)}</td>
                <td className={getProfitClassName(fund.price - fund.contributionSum)}>
                  {formatAmountForCurrency(fund.price - fund.contributionSum)}
                </td>
                <td>{formatAmountForCurrency(fund.price)}</td>
              </tr>
            ))}
        </tbody>
        <tfoot>
          <tr>
            <td>Kokku</td>
            <td>{formatAmountForCurrency(totalsOfPillars.contributions)}</td>
            <td className={getProfitClassName(totalsOfPillars.profit)}>
              {formatAmountForCurrency(totalsOfPillars.profit)}
            </td>
            <td>{formatAmountForCurrency(totalsOfPillars.value)}</td>
          </tr>
        </tfoot>
      </Table>
    </Fragment>
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
