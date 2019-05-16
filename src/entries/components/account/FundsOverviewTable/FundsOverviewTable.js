import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { Message } from 'retranslate';

import './FundsOverviewTable.scss';
import { formatAmountForCurrency, getProfitClassName } from '../../common/utils';
import { calculateTotals, getSumOfPillars } from './fundCalculations';
import Table from '../../common/table/Table';

const FundsOverviewTable = ({ funds }) => {
  const groupedPillars = getSumOfPillars(funds);
  const totalsOfPillars = calculateTotals(groupedPillars);

  return (
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
        {groupedPillars &&
          groupedPillars.map(({ pillar, contributions, value }) => (
            <tr key={pillar}>
              <td>
                {pillar === '2' ? (
                  <Message>overview.title.pillar.2</Message>
                ) : (
                  <Message>overview.title.pillar.3</Message>
                )}
              </td>
              <td>{formatAmountForCurrency(contributions)}</td>
              <td className={value - contributions >= 0 ? 'profit-positive' : 'profit-negative'}>
                {formatAmountForCurrency(value - contributions)}
              </td>
              <td>{formatAmountForCurrency(value)}</td>
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
  );
};

FundsOverviewTable.defaultProps = {
  funds: [],
};

FundsOverviewTable.propTypes = {
  funds: Types.arrayOf(
    Types.shape({
      price: Types.number,
      currency: Types.string,
      name: Types.string,
      manager: Types.string,
      isin: Types.string,
      activeFund: Types.bool,
    }),
  ),
};

export default FundsOverviewTable;
