import React from 'react';
import Types from 'prop-types';
import { Message } from 'retranslate';
import sumBy from 'lodash/sumBy';

import { formatAmountForCurrency } from '../../common/utils';
import Table from '../../common/table';

const AccountStatement = ({ funds }) => {
  const columns = [
    {
      title: <Message>overview.table.header.instrument</Message>,
      dataIndex: 'name',
      footer: <Message>overview.total</Message>,
    },
    {
      title: <Message>overview.table.header.value</Message>,
      dataIndex: 'value',
      footer: formatAmountForCurrency(getTotalValueOfFunds(funds)),
    },
  ];

  const dataSource = funds.map(({ isin, name, activeFund: isActive, price: value }) => ({
    name: `${name}${isActive ? '*' : ''}`,
    value: formatAmountForCurrency(value),
    key: isin,
  }));

  return (
    <>
      <Table columns={columns} dataSource={dataSource}></Table>

      <small className="text-muted">
        <Message>overview.active.fund</Message>
      </small>
    </>
  );
};

function getTotalValueOfFunds(funds) {
  return sumBy(funds, 'price');
}

AccountStatement.propTypes = {
  funds: Types.arrayOf(
    Types.shape({
      isin: Types.string.isRequired,
      name: Types.string.isRequired,
      activeFund: Types.bool,
      price: Types.number,
    }),
  ).isRequired,
};

export default AccountStatement;
