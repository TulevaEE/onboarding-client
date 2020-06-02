import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { Message } from 'retranslate';
import sumBy from 'lodash/sumBy';

import Table from '../../common/table';
import Euro from '../../common/Euro';

const AccountSummary = ({
  secondPillarContributions,
  secondPillarSubtractions,
  secondPillarSourceFunds,

  thirdPillarContributions,
  thirdPillarSubtractions,
  thirdPillarSourceFunds,
}) => {
  const getPillarSummary = (pillarLabel, contributions, subtractions, funds) => {
    const value = sumBy(funds, fund => {
      return fund.price + fund.unavailablePrice;
    });

    return {
      pillar: pillarLabel,
      contributions,
      subtractions,
      profit: value - contributions + subtractions,
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
        <span className="text-success">
          <Euro amount={sumBy(summary, summaryItem => summaryItem.profit)} />
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
      <span className="text-success">
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
};

export default AccountSummary;
