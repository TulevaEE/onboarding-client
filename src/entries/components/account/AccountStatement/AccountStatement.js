import React from 'react';
import Types from 'prop-types';
import { Message } from 'retranslate';
import sumBy from 'lodash/sumBy';

import Table from '../../common/table';
import Euro from '../../common/Euro';

const AccountStatement = ({ funds }) => {
  const columns = [
    {
      title: <Message>accountStatement.columns.fund.title</Message>,
      dataIndex: 'fund',
      footer: <Message>accountStatement.columns.fund.footer</Message>,
    },
    {
      title: <Message>accountStatement.columns.value.title</Message>,
      dataIndex: 'value',
      footer: <Euro amount={getTotalValueOfFunds(funds)} />,
    },
  ];

  const dataSource = funds.map(({ isin, name, activeFund: isActive, price: value }) => ({
    fund: `${name}${isActive ? '*' : ''}`,
    value: <Euro amount={value} />,
    key: isin,
  }));

  return (
    <>
      <Table columns={columns} dataSource={dataSource}></Table>

      <small className="text-muted">
        <Message>accountStatement.activeFundNotice</Message>
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
