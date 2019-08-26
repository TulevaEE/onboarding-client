import React from 'react';
import Types from 'prop-types';
import { Message } from 'retranslate';

import { formatAmountForCurrency } from '../../common/utils';
import Table from '../../common/table';

const MemberCapital = ({
  value: { capitalPayment, profit, membershipBonus, workCompensation, unvestedWorkCompensation },
}) => {
  const columns = [
    {
      title: <Message>overview.table.header.instrument</Message>,
      dataIndex: 'instrument',
      footer: <Message>overview.total</Message>,
    },
    {
      title: <Message>overview.table.header.value</Message>,
      dataIndex: 'value',
      footer: formatAmountForCurrency(
        capitalPayment + membershipBonus + profit + unvestedWorkCompensation + workCompensation,
      ),
    },
  ];

  const dataSource = [
    {
      instrument: <Message>member.capital.capital.payment</Message>,
      value: formatAmountForCurrency(capitalPayment),
      key: 'payment',
    },
    {
      instrument: <Message>member.capital.profit</Message>,
      value: formatAmountForCurrency(profit),
      key: 'profit',
    },
    {
      instrument: <Message>member.capital.member.bonus</Message>,
      value: formatAmountForCurrency(membershipBonus),
      key: 'bonus',
    },
  ];

  if (workCompensation) {
    dataSource.push({
      instrument: <Message>member.capital.work.compensation</Message>,
      value: formatAmountForCurrency(workCompensation),
      key: 'work',
    });
  }

  if (unvestedWorkCompensation) {
    dataSource.push({
      instrument: <Message>member.capital.unvested.work.compensation</Message>,
      value: formatAmountForCurrency(unvestedWorkCompensation),
      key: 'unvestedWork',
    });
  }

  return <Table columns={columns} dataSource={dataSource} />;
};

MemberCapital.propTypes = {
  value: Types.shape({
    capitalPayment: Types.number,
    profit: Types.number,
    membershipBonus: Types.number,
    workCompensation: Types.number,
    unvestedWorkCompensation: Types.number,
  }),
};

MemberCapital.defaultProps = {
  value: {
    capitalPayment: 0,
    profit: 0,
    membershipBonus: 0,
    workCompensation: 0,
    unvestedWorkCompensation: 0,
  },
};

export default MemberCapital;
