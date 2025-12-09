import React from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import StatusBoxRow from '../statusBoxRow';
import { Application, Conversion, SourceFund } from '../../../common/apiModels';
import { State } from '../../../../types';
import ThirdPillarPaymentsAmount from './ThirdPillarContributionAmount';
import {
  useFundPensionStatus,
  useMandateDeadlines,
  usePendingApplications,
} from '../../../common/apiHooks';
import { ActiveFundPensionDescription } from '../ActiveFundPensionDescription';
import { InfoTooltip } from '../../../common/infoTooltip/InfoTooltip';
import { formatDateTime } from '../../../common/dateFormatter';

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
  const { data: fundPensionStatus } = useFundPensionStatus();
  const { data: mandateDeadlines } = useMandateDeadlines();

  const formattedPaymentDeadline = formatDateTime(mandateDeadlines?.thirdPillarPaymentDeadline);

  if (!thirdPillarActive || !activeFund) {
    return (
      <StatusBoxRow
        status="ERROR"
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

  const activeThirdPillarFundPension = fundPensionStatus?.fundPensions.find(
    (fundPension) => fundPension.active && fundPension.pillar === 'THIRD',
  );

  if (activeThirdPillarFundPension) {
    return (
      <StatusBoxRow
        status="SUCCESS"
        name={<FormattedMessage id="account.status.choice.pillar.third" />}
        showAction={!loading}
        lines={[
          <FormattedMessage id="account.status.choice.pillar.third.fundPension.active" />,
          <ActiveFundPensionDescription fundPension={activeThirdPillarFundPension} />,
        ]}
      >
        <Link to="/3rd-pillar-payment" className="btn btn-primary">
          <FormattedMessage id="account.status.choice.pillar.third.success.action" />
        </Link>
      </StatusBoxRow>
    );
  }

  if (conversion.pendingWithdrawal) {
    const pendingPartialWithdrawalApplication = usePendingThirdPillarWithdrawalApplication();
    const pendingFundPensionOpeningApplication = usePendingFundPensionOpeningApplication();

    if (pendingFundPensionOpeningApplication && pendingPartialWithdrawalApplication) {
      return (
        <StatusBoxRow
          status="SUCCESS"
          showAction={!loading}
          name={<FormattedMessage id="account.status.choice.pillar.third" />}
          lines={[
            <FormattedMessage id="account.status.choice.pillar.third.fundPensionOpeningPartialWithdrawal" />,
          ]}
        >
          <Link to="/3rd-pillar-payment" className="btn btn-primary">
            <FormattedMessage id="account.status.choice.pillar.third.success.action" />
          </Link>
        </StatusBoxRow>
      );
    }

    if (pendingFundPensionOpeningApplication) {
      return (
        <StatusBoxRow
          status="SUCCESS"
          showAction={!loading}
          name={<FormattedMessage id="account.status.choice.pillar.third" />}
          lines={[<FormattedMessage id="account.status.choice.pillar.third.fundPensionOpening" />]}
        >
          <Link to="/3rd-pillar-payment" className="btn btn-primary">
            <FormattedMessage id="account.status.choice.pillar.third.success.action" />
          </Link>
        </StatusBoxRow>
      );
    }

    if (pendingPartialWithdrawalApplication) {
      return (
        <StatusBoxRow
          status="SUCCESS"
          showAction={!loading}
          name={<FormattedMessage id="account.status.choice.pillar.third" />}
          lines={[<FormattedMessage id="account.status.choice.pillar.third.partialWithdrawal" />]}
        >
          <Link to="/3rd-pillar-payment" className="btn btn-primary">
            <FormattedMessage id="account.status.choice.pillar.third.success.action" />
          </Link>
        </StatusBoxRow>
      );
    }
  }

  const month = new Date().getMonth();
  const isFebruaryToNovember = month > 0 && month < 11;
  const isDecember = month === 11;

  const isPartiallyConverted = conversion.selectionPartial || conversion.transfersPartial;
  if (!isPartiallyConverted) {
    const activeFundFee = activeFund?.ongoingChargesFigure || 0;
    const hasHighFees =
      conversion.weightedAverageFee > 0.005 ||
      (conversion.contribution.total === 0 && activeFundFee > 0.005);

    if (hasHighFees) {
      return (
        <StatusBoxRow
          status="ERROR"
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
        status="SUCCESS"
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
        <Link to="/3rd-pillar-flow" className="btn btn-outline-primary">
          <FormattedMessage id="account.status.choice.pillar.third.inactive.action" />
        </Link>
      </StatusBoxRow>
    );
  }

  const isFullyConverted = conversion.selectionComplete && conversion.transfersComplete;
  if (!isFullyConverted) {
    return (
      <StatusBoxRow
        status="WARNING"
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
        status="ERROR"
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
        status="WARNING"
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
        status="ERROR"
        showAction={!loading}
        name={<FormattedMessage id="account.status.choice.pillar.third" />}
        lines={[
          <FormattedMessage
            id="account.status.choice.pillar.third.paymentDeadline"
            values={{
              deadline: formattedPaymentDeadline,
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
      status="SUCCESS"
      showAction={!loading}
      name={<FormattedMessage id="account.status.choice.pillar.third" />}
      lines={[
        <FormattedMessage id="account.status.choice.lowFee.index.label" />,
        <ThirdPillarPaymentsAmount />,
      ]}
    >
      <Link
        to="/3rd-pillar-payment"
        className={`btn ${isDecember ? 'btn-primary' : 'btn-outline-primary'}`}
      >
        <FormattedMessage id="account.status.choice.pillar.third.success.action" />
      </Link>
    </StatusBoxRow>
  );
};

const usePendingThirdPillarWithdrawalApplication = (): Application | undefined =>
  usePendingApplications().data?.find(
    (application) => application.type === 'WITHDRAWAL_THIRD_PILLAR',
  );

const usePendingFundPensionOpeningApplication = (): Application | undefined =>
  usePendingApplications().data?.find(
    (application) => application.type === 'FUND_PENSION_OPENING_THIRD_PILLAR',
  );

const mapStateToProps = (state: State) => ({
  conversion: state.login.userConversion.thirdPillar,
  loading: state.login.loadingUserConversion,
  thirdPillarFunds: state.thirdPillar.sourceFunds,
  thirdPillarActive: state.login.user.thirdPillarActive,
});

export default connect(mapStateToProps)(ThirdPillarStatusBox);
