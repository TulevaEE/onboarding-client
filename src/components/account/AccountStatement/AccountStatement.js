import React from 'react';
import Types from 'prop-types';
import { Message } from 'retranslate';
import sumBy from 'lodash/sumBy';

import Table from '../../common/table';
import Euro from '../../common/Euro';
import Percentage from '../../common/Percentage';

const AccountStatement = ({ funds }) => {
  const columns = [
    {
      title: <Message>accountStatement.columns.fund.title</Message>,
      dataIndex: 'fund',
      footer: <Message>accountStatement.columns.fund.footer</Message>,
    },
    {
      title: <Message>accountStatement.columns.fees.title</Message>,
      dataIndex: 'fees',
      hideOnMobile: true,
    },
    {
      title: <Message>accountStatement.columns.value.title</Message>,
      dataIndex: 'value',
      footer: (
        <Euro
          amount={sumBy(funds, (fund) => {
            return fund.price + fund.unavailablePrice;
          })}
        />
      ),
    },
  ];

  const dataSource = funds.map(
    ({
      isin,
      name,
      activeFund: isActive,
      ongoingChargesFigure,
      price: value,
      unavailablePrice: unavailableValue,
    }) => ({
      fund: `${name}${isActive ? '*' : ''}`,
      fees: <Percentage value={ongoingChargesFigure} />,
      value: <Euro amount={value + unavailableValue} />,
      key: isin,
    }),
  );

  const showActiveFundNotice = funds.some(({ activeFund }) => activeFund);
  const fundPillar = funds.every(({ pillar }) => pillar === 2) ? 'secondPillar' : 'thirdPillar';

  return (
    <>
      <Table columns={columns} dataSource={dataSource} />

      {showActiveFundNotice && (
        <small className="text-muted">
          <Message
            dangerouslyTranslateInnerHTML={`accountStatement.${fundPillar}.activeFundNotice`}
          />
        </small>
      )}
    </>
  );
};

AccountStatement.propTypes = {
  funds: Types.arrayOf(
    Types.shape({
      isin: Types.string.isRequired,
      name: Types.string.isRequired,
      activeFund: Types.bool,
      contributions: Types.number,
      subtractions: Types.number,
      profit: Types.number,
      price: Types.number,
      unavailablePrice: Types.number,
    }),
  ).isRequired,
};

export default AccountStatement;
