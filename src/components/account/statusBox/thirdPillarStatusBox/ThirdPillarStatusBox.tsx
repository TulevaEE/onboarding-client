import React from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import StatusBoxRow from '../statusBoxRow';
import { Conversion, SourceFund } from '../../../common/apiModels';
import { InfoTooltip } from '../../../common';
import { State } from '../../../../types';
import ThirdPillarPaymentsThisYear from './ThirdPillarYearToDateContribution';

interface Props {
  conversion: Conversion;
  loading: boolean;
  sourceFunds: SourceFund[];
  pillarActive: boolean;
}

export const ThirdPillarStatusBox: React.FunctionComponent<Props> = ({
  conversion,
  loading = false,
  sourceFunds = [],
  pillarActive,
}) => {
  if (!pillarActive) {
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

  const activeFunds = sourceFunds
    .filter((fund) => fund.activeFund)
    .map(({ name }) => name.replaceAll(' ', '\u00a0'))
    .join(', ');

  const month = new Date().getMonth();
  const isDecember = month === 11;
  const isFebruaryToNovember = month > 0 && month < 11;

  const isPartiallyConverted = conversion.selectionPartial || conversion.transfersPartial;
  if (!isPartiallyConverted) {
    return (
      <StatusBoxRow
        error
        showAction={!loading}
        name={<FormattedMessage id="account.status.choice.pillar.third" />}
        lines={[activeFunds, <ThirdPillarPaymentsThisYear />]}
      >
        <Link to="/3rd-pillar-flow" className="btn btn-primary">
          <FormattedMessage id="account.status.choice.pillar.third.inactive.action" />
        </Link>
      </StatusBoxRow>
    );
  }

  if (
    !conversion.selectionPartial ||
    !conversion.transfersPartial ||
    !conversion.selectionComplete ||
    !conversion.transfersComplete
  ) {
    return (
      <StatusBoxRow
        warning
        showAction={!loading}
        name={<FormattedMessage id="account.status.choice.pillar.third" />}
        lines={[
          <FormattedMessage id="account.status.choice.pillar.third.transferIncomplete.label" />,
          <ThirdPillarPaymentsThisYear />,
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
            <FormattedMessage id="account.status.choice.pillar.third.paymentIncomplete.label" />
            <InfoTooltip name="third-pillar-tooltip">
              <FormattedMessage id="account.status.choice.pillar.third.paymentInfo" />
            </InfoTooltip>
          </>,
          <ThirdPillarPaymentsThisYear />,
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
          <ThirdPillarPaymentsThisYear />,
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
      lines={[activeFunds, <ThirdPillarPaymentsThisYear />]}
    >
      <Link to="/3rd-pillar-payment" className="btn btn-primary">
        <FormattedMessage id="account.status.choice.pillar.third.success.action" />
      </Link>
    </StatusBoxRow>
  );
};

const mapStateToProps = (state: State) => ({
  conversion: state.login.userConversion.thirdPillar,
  loading: state.login.loadingUserConversion,
  sourceFunds: state.thirdPillar.sourceFunds,
  pillarActive: state.login.user.thirdPillarActive,
});

export default connect(mapStateToProps)(ThirdPillarStatusBox);
