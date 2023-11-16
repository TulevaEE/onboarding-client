import React from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import StatusBoxRow from '../statusBoxRow';
import { Conversion, SourceFund } from '../../../common/apiModels';
import { InfoTooltip } from '../../../common';
import { State } from '../../../../types';
import ThirdPillarPaymentsAmount from './ThirdPillarContributionAmount';

interface Props {
  conversion: Conversion;
  loading: boolean;
  thirdPillarFunds: SourceFund[];
  thirdPillarActive: boolean;
}

export const ThirdPillarStatusBox: React.FunctionComponent<Props> = ({
  conversion,
  loading = false,
  thirdPillarFunds = [],
  thirdPillarActive,
}) => {
  const activeFund = thirdPillarFunds.find((fund) => fund.activeFund);

  if (!thirdPillarActive || !activeFund) {
    return (
      <StatusBoxRow
        error
        showAction={!loading}
        name={<FormattedMessage id="account.status.choice.pillar.third" />}
        lines={[<FormattedMessage id="account.status.choice.pillar.third.missing.label" />]}
      >
        <Link to="/3rd-pillar-flow" className="btn btn-primary">
          <FormattedMessage id="account.status.choice.pillar.third.missing.action" />
        </Link>
      </StatusBoxRow>
    );
  }

  const month = new Date().getMonth();
  const isFebruaryToNovember = month > 0 && month < 11;
  const isDecember = month === 11;

  const isPartiallyConverted = conversion.selectionPartial || conversion.transfersPartial;
  if (!isPartiallyConverted) {
    if (conversion.weightedAverageFee > 0.005) {
      return (
        <StatusBoxRow
          error
          showAction={!loading}
          name={<FormattedMessage id="account.status.choice.pillar.third" />}
          lines={[
            <>
              <FormattedMessage id="account.status.choice.highFee.label" />
              <InfoTooltip name="third-pillar-tooltip">
                <FormattedMessage id="account.status.choice.highFee.description" />
              </InfoTooltip>
            </>,
            <ThirdPillarPaymentsAmount />,
          ]}
        >
          <Link to="/3rd-pillar-flow" className="btn btn-primary">
            <FormattedMessage id="account.status.choice.choose.low.fees" />
          </Link>
        </StatusBoxRow>
      );
    }
    return (
      <StatusBoxRow
        ok
        showAction={!loading}
        name={<FormattedMessage id="account.status.choice.pillar.third" />}
        lines={[
          <>
            <FormattedMessage id="account.status.choice.lowFee.label" />
            <InfoTooltip name="third-pillar-tooltip">
              <FormattedMessage id="account.status.choice.lowFee.description" />
            </InfoTooltip>
          </>,
          <ThirdPillarPaymentsAmount />,
        ]}
      >
        <Link to="/3rd-pillar-flow" className="btn btn-light">
          <FormattedMessage id="account.status.choice.pillar.third.inactive.action" />
        </Link>
      </StatusBoxRow>
    );
  }

  const isFullyConverted = conversion.selectionComplete && conversion.transfersComplete;
  if (!isFullyConverted) {
    return (
      <StatusBoxRow
        warning
        showAction={!loading}
        name={<FormattedMessage id="account.status.choice.pillar.third" />}
        lines={[
          <FormattedMessage id="account.status.choice.pillar.third.transferIncomplete.label" />,
          <ThirdPillarPaymentsAmount />,
        ]}
      >
        <Link to="/3rd-pillar-payment" className="btn btn-primary">
          <FormattedMessage id="account.status.choice.pillar.third.success.action" />
        </Link>
      </StatusBoxRow>
    );
  }

  if (conversion.contribution.total === 0) {
    return (
      <StatusBoxRow
        error
        showAction={!loading}
        name={<FormattedMessage id="account.status.choice.pillar.third" />}
        lines={[
          <>
            <FormattedMessage id="account.status.choice.pillar.third.paymentIncomplete.label" />
            <InfoTooltip name="third-pillar-tooltip">
              <FormattedMessage id="account.status.choice.pillar.third.paymentInfo" />
            </InfoTooltip>
          </>,
          <ThirdPillarPaymentsAmount />,
        ]}
      >
        <Link to="/3rd-pillar-payment" className="btn btn-primary">
          <FormattedMessage id="account.status.choice.pillar.third.success.action" />
        </Link>
      </StatusBoxRow>
    );
  }

  if (conversion.contribution.yearToDate === 0 && isFebruaryToNovember) {
    return (
      <StatusBoxRow
        warning
        showAction={!loading}
        name={<FormattedMessage id="account.status.choice.pillar.third" />}
        lines={[
          <>
            <FormattedMessage id="account.status.choice.pillar.third.thisYearPaymentIncomplete.label" />
            <InfoTooltip name="third-pillar-tooltip">
              <FormattedMessage id="account.status.choice.pillar.third.paymentInfo" />
            </InfoTooltip>
          </>,
          <ThirdPillarPaymentsAmount />,
        ]}
      >
        <Link to="/3rd-pillar-payment" className="btn btn-primary">
          <FormattedMessage id="account.status.choice.pillar.third.success.action" />
        </Link>
      </StatusBoxRow>
    );
  }

  if (conversion.contribution.yearToDate === 0 && isDecember) {
    return (
      <StatusBoxRow
        error
        showAction={!loading}
        name={<FormattedMessage id="account.status.choice.pillar.third" />}
        lines={[
          <FormattedMessage
            id="account.status.choice.pillar.third.paymentDeadline"
            values={{
              b: (chunks: string) => <b className="highlight text-nowrap">{chunks}</b>,
            }}
          />,
          <ThirdPillarPaymentsAmount />,
        ]}
      >
        <Link to="/3rd-pillar-payment" className="btn btn-primary">
          <FormattedMessage id="account.status.choice.pillar.third.success.action" />
        </Link>
      </StatusBoxRow>
    );
  }

  return (
    <StatusBoxRow
      ok
      showAction={!loading}
      name={<FormattedMessage id="account.status.choice.pillar.third" />}
      lines={[
        <>
          <FormattedMessage id="account.status.choice.lowFee.index.label" />
          <InfoTooltip name="third-pillar-tooltip">
            <FormattedMessage id="account.status.choice.lowFee.description" />
          </InfoTooltip>
        </>,
        <ThirdPillarPaymentsAmount />,
      ]}
    >
      <Link to="/3rd-pillar-payment" className="btn btn-outline-primary">
        <FormattedMessage id="account.status.choice.pillar.third.success.action" />
      </Link>
    </StatusBoxRow>
  );
};

const mapStateToProps = (state: State) => ({
  conversion: state.login.userConversion.thirdPillar,
  loading: state.login.loadingUserConversion,
  thirdPillarFunds: state.thirdPillar.sourceFunds,
  thirdPillarActive: state.login.user.thirdPillarActive,
});

export default connect(mapStateToProps)(ThirdPillarStatusBox);
