import React from 'react';
import { PropTypes as Types } from 'prop-types';
import sumBy from 'lodash/sumBy';

import { FormattedMessage } from 'react-intl';
import Table, { getProfitClassName } from '../../common/table';
import Euro from '../../common/Euro';
import { Shimmer } from '../../common/shimmer/Shimmer';

export const AccountSummaryLoader = () => {
  return (
    <div>
      <Shimmer height={26} />
      <div className="mt-4">
        <Shimmer height={26} />
      </div>
      <div className="mt-4">
        <Shimmer height={26} />
      </div>
      <div className="mt-4">
        <Shimmer height={26} />
      </div>
    </div>
  );
};

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
    const value = sumBy(funds, (fund) => {
      return fund.price + fund.unavailablePrice;
    });

    return {
      pillarLabel,
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
      pillarLabel: 'memberCapital.heading',
      contributions:
        memberCapital.capitalPayment +
        memberCapital.unvestedWorkCompensation +
        memberCapital.workCompensation,
      subtractions: 0, // ?
      profit: memberCapital.profit + memberCapital.membershipBonus,
      value: memberCapital.total,
    });
  }

  const summaryItemProfit = sumBy(summary, (summaryItem) => summaryItem.profit);

  const columns = [
    {
      title: <FormattedMessage id="accountSummary.columns.pillar.title" />,
      dataIndex: 'pillarLabel',
      footer: <FormattedMessage id="accountSummary.columns.pillar.footer" />,
    },
    {
      title: <FormattedMessage id="accountSummary.columns.contributions" />,
      dataIndex: 'contributions',
      hideOnMobile: true,
      footer: <Euro amount={sumBy(summary, (summaryItem) => summaryItem.contributions)} />,
    },
    {
      title: <FormattedMessage id="accountSummary.columns.subtractions" />,
      dataIndex: 'subtractions',
      hideOnMobile: true,
      footer: <Euro amount={sumBy(summary, (summaryItem) => summaryItem.subtractions)} />,
    },
    {
      title: <FormattedMessage id="accountSummary.columns.profit" />,
      dataIndex: 'profit',
      hideOnMobile: true,
      footer: (
        <span className={getProfitClassName(summaryItemProfit)}>
          <Euro amount={summaryItemProfit} />
        </span>
      ),
    },
    {
      title: <FormattedMessage id="accountSummary.columns.value" />,
      dataIndex: 'value',
      footer: <Euro amount={sumBy(summary, (summaryItem) => summaryItem.value)} />,
    },
  ];

  const dataSource = summary.map(({ pillarLabel, contributions, subtractions, profit, value }) => ({
    pillarLabel: <FormattedMessage id={pillarLabel} />,
    contributions: <Euro amount={contributions} />,
    subtractions: <Euro amount={subtractions} />,
    profit: (
      <span className={getProfitClassName(profit)}>
        <Euro amount={profit} />
      </span>
    ),
    value: <Euro amount={value} />,
    key: pillarLabel,
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
