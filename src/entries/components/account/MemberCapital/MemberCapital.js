import React from 'react';
import Types from 'prop-types';
import { Message } from 'retranslate';

import Table from '../../common/table';
import Euro from '../../common/Euro';

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
      footer: (
        <Euro
          amount={
            capitalPayment + membershipBonus + profit + unvestedWorkCompensation + workCompensation
          }
        />
      ),
    },
  ];

  const dataSource = [
    {
      instrument: <Message>member.capital.capital.payment</Message>,
      value: <Euro amount={capitalPayment} />,
      key: 'payment',
    },
    {
      instrument: <Message>member.capital.profit</Message>,
      value: <Euro amount={profit} />,
      key: 'profit',
    },
    {
      instrument: <Message>member.capital.member.bonus</Message>,
      value: <Euro amount={membershipBonus} />,
      key: 'bonus',
    },
  ];

  if (workCompensation) {
    dataSource.push({
      instrument: <Message>member.capital.work.compensation</Message>,
      value: <Euro amount={workCompensation} />,
      key: 'work',
    });
  }

  if (unvestedWorkCompensation) {
    dataSource.push({
      instrument: <Message>member.capital.unvested.work.compensation</Message>,
      value: <Euro amount={unvestedWorkCompensation} />,
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
