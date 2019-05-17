import React from 'react';
import Types from 'prop-types';
import { Message } from 'retranslate';

import './FundsOverviewTable.scss';
import { formatAmountForCurrency, getProfitClassName } from '../../common/utils';
import { calculateTotals, getSumOfPillars } from './fundCalculations';
import Table from '../../common/table/Table';

const FundsOverviewTable = ({ funds }) => {
  const groupedPillars = getSumOfPillars(funds);
  const totalsOfPillars = calculateTotals(groupedPillars);
  const titleKeysForPillars = {
    2: 'overview.title.pillar.2',
    3: 'overview.title.pillar.3',
  };

  return (
    <Table>
      <thead>
        <tr>
          <th>
            <Message>overview.table.header.instrument</Message>
          </th>
          <th>
            <Message>overview.table.header.contributions</Message>
          </th>
          <th>
            <Message>overview.table.header.profit</Message>
          </th>
          <th>
            <Message>overview.table.header.value</Message>
          </th>
        </tr>
      </thead>
      <tbody>
        {groupedPillars &&
          groupedPillars.map(({ pillar, contributions, value }) => (
            <tr key={pillar}>
              <td>
                <Message className="mb-2 lead h5">{titleKeysForPillars[pillar]}</Message>
              </td>
              <td>{formatAmountForCurrency(contributions)}</td>
              <td className={getProfitClassName(value - contributions)}>
                {formatAmountForCurrency(value - contributions)}
              </td>
              <td>{formatAmountForCurrency(value)}</td>
            </tr>
          ))}
      </tbody>
      <tfoot>
        <tr>
          <td>
            <Message>overview.total</Message>
          </td>
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
