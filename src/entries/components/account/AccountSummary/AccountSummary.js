import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { Message } from 'retranslate';
import sumBy from 'lodash/sumBy';

import Table, { getProfitClassName } from '../../common/table';
import Euro from '../../common/Euro';
import MemberCapital from '../MemberCapital';

const AccountSummary = ({
  secondPillarContributions,
  secondPillarSubtractions,
  secondPillarSourceFunds,

  thirdPillarContributions,
  thirdPillarSubtractions,
  thirdPillarSourceFunds,

  memberCapital,
}) => {
  const getPillarSummary = (pillarLabel, contributions, subtractions, funds) => {
    const value = sumBy(funds, fund => {
      return fund.price + fund.unavailablePrice;
    });

    return {
      pillar: pillarLabel,
      contributions,
      subtractions,
      profit: value - contributions - subtractions,
      value,
    };
  };

  const summary = [
    getPillarSummary(
      'accountStatement.secondPillar.heading',
      secondPillarContributions,
      secondPillarSubtractions,
      secondPillarSourceFunds,
    ),
    getPillarSummary(
      'accountStatement.thirdPillar.heading',
      thirdPillarContributions,
      thirdPillarSubtractions,
      thirdPillarSourceFunds,
    ),
  ];

  if (memberCapital) {
    summary.push({
      pillar: 'memberCapital.heading',
      contributions:
        memberCapital.capitalPayment +
        memberCapital.unvestedWorkCompensation +
        memberCapital.workCompensation,
      subtractions: 0, // ?
      profit: memberCapital.profit + memberCapital.membershipBonus,
      value: memberCapital.total,
    });
  }

  const summaryItemProfit = sumBy(summary, summaryItem => summaryItem.profit);

  const columns = [
    {
      title: <Message>accountSummary.columns.pillar.title</Message>,
      dataIndex: 'pillar',
      footer: <Message>accountSummary.columns.pillar.footer</Message>,
    },
    {
      title: <Message>accountSummary.columns.contributions</Message>,
      dataIndex: 'contributions',
      hideOnMobile: true,
      footer: <Euro amount={sumBy(summary, summaryItem => summaryItem.contributions)} />,
    },
    {
      title: <Message>accountSummary.columns.subtractions</Message>,
      dataIndex: 'subtractions',
      hideOnMobile: true,
      footer: <Euro amount={sumBy(summary, summaryItem => summaryItem.subtractions)} />,
    },
    {
      title: <Message>accountSummary.columns.profit</Message>,
      dataIndex: 'profit',
      hideOnMobile: true,
      footer: (
        <span className={getProfitClassName(summaryItemProfit)}>
          <Euro amount={summaryItemProfit} />
        </span>
      ),
    },
    {
      title: <Message>accountSummary.columns.value</Message>,
      dataIndex: 'value',
      footer: <Euro amount={sumBy(summary, summaryItem => summaryItem.value)} />,
    },
  ];

  const dataSource = summary.map(({ pillar, contributions, subtractions, profit, value }) => ({
    pillar: <Message>{pillar}</Message>,
    contributions: <Euro amount={contributions} />,
    subtractions: <Euro amount={subtractions} />,
    profit: (
      <span className={getProfitClassName(profit)}>
        <Euro amount={profit} />
      </span>
    ),
    value: <Euro amount={value} />,
    key: pillar,
  }));

  return (
    <>
      <Table columns={columns} dataSource={dataSource} />
    </>
  );
};

AccountSummary.defaultProps = {
  memberCapital: {},
};

AccountSummary.propTypes = {
  secondPillarContributions: Types.number.isRequired,
  secondPillarSubtractions: Types.number.isRequired,
  thirdPillarContributions: Types.number.isRequired,
  thirdPillarSubtractions: Types.number.isRequired,
  secondPillarSourceFunds: Types.arrayOf(
    Types.shape({
      activeFund: Types.bool,
      contributions: Types.number,
      subtractions: Types.number,
      profit: Types.number,
      price: Types.number,
      unavailablePrice: Types.number,
    }),
  ).isRequired,
  thirdPillarSourceFunds: Types.arrayOf(
    Types.shape({
      activeFund: Types.bool,
      contributions: Types.number,
      subtractions: Types.number,
      profit: Types.number,
      price: Types.number,
      unavailablePrice: Types.number,
    }),
  ).isRequired,
  memberCapital: Types.shape({
    capitalPayment: Types.number,
    unvestedWorkCompensation: Types.number,
    workCompensation: Types.number,
    membershipBonus: Types.number,
    profit: Types.number,
    total: Types.number,
  }),
};

export default AccountSummary;
