import React from 'react';
import { PropTypes as Types } from 'prop-types';
import sumBy from 'lodash/sumBy';

import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import Table from '../../common/table';
import { Euro } from '../../common/Euro';
import { Shimmer } from '../../common/shimmer/Shimmer';
import { getValueSum, getWeightedAverageFee } from '../AccountStatement/fundSelector';
import { Fees } from '../../common/Percentage/Fees';

export const AccountSummaryLoader = () => (
  <div className="d-flex flex-column gap-3">
    <div>
      <Shimmer height={40} />
    </div>
    <div>
      <Shimmer height={40} />
    </div>
    <div>
      <Shimmer height={40} />
    </div>
    <div>
      <Shimmer height={40} />
    </div>
  </div>
);

const AccountSummary = ({
  secondPillarContributions,
  secondPillarSubtractions,
  secondPillarSourceFunds,

  thirdPillarContributions,
  thirdPillarSubtractions,
  thirdPillarSourceFunds,

  memberCapital,
  savingsFundBalance,
}) => {
  const getPillarSummary = (pillar, pillarLabel, contributions, subtractions, funds) => {
    const value = getValueSum(funds);
    const feesPercent = getWeightedAverageFee(funds);
    const feesEuro = feesPercent * value;

    return {
      pillar,
      pillarLabel,
      feesPercent,
      feesEuro,
      contributions,
      subtractions,
      profit: value - contributions - subtractions,
      value,
    };
  };

  const summary = [
    getPillarSummary(
      2,
      'accountStatement.secondPillar.heading',
      secondPillarContributions,
      secondPillarSubtractions,
      secondPillarSourceFunds,
    ),
    getPillarSummary(
      3,
      'accountStatement.thirdPillar.heading',
      thirdPillarContributions,
      thirdPillarSubtractions,
      thirdPillarSourceFunds,
    ),
  ];

  const secondAndThirdPillarValueSum = sumBy(summary, (summaryItem) => summaryItem.value);
  const weightedAverageFee =
    secondAndThirdPillarValueSum <= 0
      ? 0
      : summary.reduce(
          (accumulator, summaryItem) =>
            accumulator +
            (summaryItem.feesPercent * summaryItem.value) / secondAndThirdPillarValueSum,
          0,
        );

  if (memberCapital) {
    summary.push({
      pillar: -1,
      pillarLabel: 'memberCapital.heading',
      feesPercent: 0,
      feesEuro: 0,
      contributions: sumBy(memberCapital, (row) => row.contributions),
      subtractions: 0, // ?
      profit: sumBy(memberCapital, (row) => row.profit),
      value: sumBy(memberCapital, (row) => row.value),
    });
  }

  if (savingsFundBalance) {
    summary.push(
      getPillarSummary(
        -1,
        'accountStatement.savingsFund.heading',
        savingsFundBalance.contributions,
        savingsFundBalance.subtractions,
        [savingsFundBalance],
      ),
    );
  }

  const feesEuroSum = sumBy(summary, (summaryItem) => summaryItem.feesEuro);
  const contributionsSum = sumBy(summary, (summaryItem) => summaryItem.contributions);
  const subtractionsSum = sumBy(summary, (summaryItem) => summaryItem.subtractions);
  const profitSum = sumBy(summary, (summaryItem) => summaryItem.profit);
  const valueSum = sumBy(summary, (summaryItem) => summaryItem.value);

  const columns = [
    {
      title: <FormattedMessage id="accountSummary.columns.pillar.title" />,
      dataIndex: 'pillarLabel',
      footer: <FormattedMessage id="accountSummary.columns.pillar.footer" />,
      width: 100,
    },
    ...(weightedAverageFee === 0
      ? []
      : [
          {
            title: (
              <>
                <FormattedMessage id="accountSummary.columns.fees" />
                &nbsp;%
              </>
            ),
            dataIndex: 'feesPercent',
            footer: <Fees value={weightedAverageFee} />,
          },
        ]),
    ...(feesEuroSum === 0
      ? []
      : [
          {
            title: (
              <>
                <FormattedMessage id="accountSummary.columns.fees" />
                &nbsp;€
              </>
            ),
            dataIndex: 'feesEuro',
            footer: <Euro className="text-body-secondary" amount={-feesEuroSum} />,
            hideOnBreakpoint: ['xs'],
          },
        ]),
    ...(contributionsSum === 0
      ? []
      : [
          {
            title: <FormattedMessage id="accountSummary.columns.contributions" />,
            dataIndex: 'contributions',
            hideOnBreakpoint: ['xs', 'sm'],
            footer: <Euro amount={contributionsSum} />,
          },
        ]),
    ...(subtractionsSum === 0
      ? []
      : [
          {
            title: <FormattedMessage id="accountSummary.columns.subtractions" />,
            dataIndex: 'subtractions',
            hideOnBreakpoint: ['xs', 'sm'],
            footer: <Euro amount={subtractionsSum} />,
          },
        ]),
    {
      title: <FormattedMessage id="accountSummary.columns.profit" />,
      dataIndex: 'profit',
      hideOnBreakpoint: ['xs', 'sm'],
      footer: <Euro amount={profitSum} />,
    },
    {
      title: <FormattedMessage id="accountSummary.columns.value" />,
      dataIndex: 'value',
      footer: <Euro amount={valueSum} />,
    },
  ];

  function getContributions(pillar, contributions) {
    if (pillar === 2) {
      return (
        <Link to="/2nd-pillar-contributions">
          <Euro amount={contributions} />
        </Link>
      );
    }
    if (pillar === 3) {
      return (
        <Link to="/3rd-pillar-contributions">
          <Euro amount={contributions} />
        </Link>
      );
    }
    return <Euro amount={contributions} />;
  }

  const dataSource = summary.map(
    ({
      pillar,
      pillarLabel,
      feesPercent,
      feesEuro,
      contributions,
      subtractions,
      profit,
      value,
    }) => ({
      pillarLabel: <FormattedMessage id={pillarLabel} />,
      feesPercent: <Fees value={feesPercent} />,
      feesEuro: feesEuro ? <Euro className="text-body-secondary" amount={-feesEuro} /> : <></>,
      contributions: getContributions(pillar, contributions),
      subtractions: <Euro amount={subtractions} />,
      profit: <Euro amount={profit} />,
      value: <Euro amount={value} />,
      key: pillarLabel,
    }),
  );

  return (
    <>
      <Table columns={columns} dataSource={dataSource} />
      <p className="m-0 mt-3 text-body-secondary text-center small">
        <FormattedMessage
          id="accountSummary.disclaimer"
          values={{
            a: (chunks) => (
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="//tuleva.ee/vastused/pensionifondide-tasud/"
              >
                {chunks}
              </a>
            ),
          }}
        />
      </p>
    </>
  );
};

AccountSummary.defaultProps = {
  memberCapital: [],
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
  memberCapital: Types.arrayOf(Types.shape()),
};

export default AccountSummary;
