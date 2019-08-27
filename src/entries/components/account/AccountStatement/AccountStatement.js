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
      title: <Message>accountStatement.columns.contributions.title</Message>,
      dataIndex: 'contributions',
      hideOnMobile: true,
    },
    {
      title: <Message>accountStatement.columns.profit.title</Message>,
      dataIndex: 'profit',
      hideOnMobile: true,
    },
    {
      title: <Message>accountStatement.columns.value.title</Message>,
      dataIndex: 'value',
      footer: <Euro amount={sumBy(funds, 'price')} />,
    },
  ];

  const dataSource = funds.map(
    ({ isin, name, activeFund: isActive, contributionSum, profit, price: value }) => ({
      fund: `${name}${isActive ? '*' : ''}`,
      contributions: <Euro amount={contributionSum} />,
      profit: <Euro amount={profit} />,
      value: <Euro amount={value} />,
      key: isin,
    }),
  );

  return (
    <>
      <Table columns={columns} dataSource={dataSource}></Table>

      <small className="text-muted">
        <Message>accountStatement.activeFundNotice</Message>
      </small>
    </>
  );
};

AccountStatement.propTypes = {
  funds: Types.arrayOf(
    Types.shape({
      isin: Types.string.isRequired,
      name: Types.string.isRequired,
      activeFund: Types.bool,
      contributionSum: Types.number,
      profit: Types.number,
      price: Types.number,
    }),
  ).isRequired,
};

export default AccountStatement;
