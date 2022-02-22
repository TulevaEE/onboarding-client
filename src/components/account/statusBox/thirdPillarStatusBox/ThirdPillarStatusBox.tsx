import React from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import StatusBoxRow from '../statusBoxRow';
import { Conversion, SourceFund } from '../../../common/apiModels';
import { InfoTooltip } from '../../../common';
import { State } from '../../../../types';

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
        showAction={!loading}
        name={<FormattedMessage id="account.status.choice.pillar.third" />}
        lines={[<FormattedMessage id="account.status.choice.pillar.third.missing.label" />]}
      >
        <Link to="/3rd-pillar-flow" className="btn btn-light">
          <FormattedMessage id="account.status.choice.pillar.third.missing.action" />
        </Link>
      </StatusBoxRow>
    );
  }

  const activeFund = sourceFunds.find((fund) => fund.activeFund)?.name;
  if (!conversion.selectionComplete) {
    return (
      <StatusBoxRow
        showAction={!loading}
        name={<FormattedMessage id="account.status.choice.pillar.third" />}
        lines={[activeFund, getPaidThisYearRow(conversion)]}
      >
        <Link to="/3rd-pillar-flow" className="btn btn-light">
          <FormattedMessage id="account.status.choice.pillar.third.inactive.action" />
        </Link>
      </StatusBoxRow>
    );
  }

  if (!conversion.transfersComplete) {
    return (
      <StatusBoxRow
        showAction={!loading}
        name={<FormattedMessage id="account.status.choice.pillar.third" />}
        lines={[
          <FormattedMessage id="account.status.choice.pillar.third.transferIncomplete.label" />,
          getPaidThisYearRow(conversion),
        ]}
      >
        <Link to="/3rd-pillar-flow" className="btn btn-light">
          <FormattedMessage id="account.status.choice.pillar.third.transferIncomplete.action" />
        </Link>
      </StatusBoxRow>
    );
  }

  if (!conversion.paymentComplete) {
    return (
      <StatusBoxRow
        showAction={!loading}
        name={<FormattedMessage id="account.status.choice.pillar.third" />}
        lines={[
          <>
            <FormattedMessage id="account.status.choice.pillar.third.paymentIncomplete.label" />
            <InfoTooltip name="third-pillar-tooltip">
              <FormattedMessage id="account.status.choice.pillar.third.paymentInfo" />
            </InfoTooltip>
          </>,
          getPaidThisYearRow(conversion),
        ]}
      >
        <Link to="/3rd-pillar-flow" className="btn btn-light">
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
      lines={[activeFund, getPaidThisYearRow(conversion)]}
    >
      <Link to="/3rd-pillar-flow" className="btn btn-light">
        <FormattedMessage id="account.status.choice.pillar.third.success.action" />
      </Link>
    </StatusBoxRow>
  );
};

const getPaidThisYearRow = (conversion: Conversion) => (
  <small className="text-muted">
    <FormattedMessage
      id="account.status.yearToDateContribution"
      values={{ contribution: <b>{conversion.contribution.yearToDate || 0}</b> }}
    />
  </small>
);

const mapStateToProps = (state: State) => ({
  conversion: state.login.userConversion.thirdPillar,
  loading: state.login.loadingUserConversion,
  sourceFunds: state.thirdPillar.sourceFunds,
  pillarActive: state.login.user.thirdPillarActive,
});

export default connect(mapStateToProps)(ThirdPillarStatusBox);
