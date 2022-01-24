import React from 'react';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { DefinitionList } from './DefinitionList';
import styles from './ApplicationCards.module.scss';
import {
  Application,
  ApplicationType,
  EarlyWithdrawalApplication,
  ResumeContributionsApplication,
  StopContributionsApplication,
  TransferApplication,
  WithdrawalApplication,
} from '../../common/apiModels';
import Percentage from '../../common/Percentage';

export const ApplicationCard: React.FunctionComponent<{
  application: Application;
  allowedActions?: ApplicationAction[];
}> = ({ application, allowedActions = [] }) => {
  switch (application.type) {
    case ApplicationType.EARLY_WITHDRAWAL:
      return <EarlyWithdrawalCard application={application} allowedActions={allowedActions} />;
    case ApplicationType.WITHDRAWAL:
      return <WithdrawalCard application={application} allowedActions={allowedActions} />;
    case ApplicationType.STOP_CONTRIBUTIONS:
      return <StopContributionsCard application={application} allowedActions={allowedActions} />;
    case ApplicationType.RESUME_CONTRIBUTIONS:
      return <ResumeContributionsCard application={application} allowedActions={allowedActions} />;
    case ApplicationType.TRANSFER:
      return <TransferApplicationCard application={application} allowedActions={allowedActions} />;
    default:
      return <></>;
  }
};

const TransferApplicationCard: React.FunctionComponent<{
  application: TransferApplication;
  allowedActions: ApplicationAction[];
}> = ({ application, allowedActions }) => (
  <BaseApplicationCard
    application={application}
    allowedActions={allowedActions}
    titleKey="applications.type.transfer.title"
  >
    <DefinitionList
      definitions={[
        {
          key: <FormattedMessage id="applications.type.transfer.sourceFund" />,
          value: application.details.sourceFund && application.details.sourceFund.name,
        },
        application.details.exchanges.map(({ targetFund, targetPik, amount }) => [
          {
            key: <FormattedMessage id="applications.type.transfer.targetFund" />,
            value: targetFund?.name || `${targetPik} (PIK)`,
          },
          {
            key: <FormattedMessage id="applications.type.transfer.amount" />,
            value:
              application.details.sourceFund.pillar === 3 ? amount : <Percentage value={amount} />,
            alignRight: true,
          },
        ]),
      ]}
    />
  </BaseApplicationCard>
);

const EarlyWithdrawalCard: React.FunctionComponent<{
  application: EarlyWithdrawalApplication;

  allowedActions: ApplicationAction[];
}> = ({ application, allowedActions }) => (
  <BaseApplicationCard
    allowedActions={allowedActions}
    application={application}
    titleKey="applications.type.earlyWithdrawal.title"
  >
    <DefinitionList
      definitions={[
        {
          key: <FormattedMessage id="applications.type.earlyWithdrawal.time" />,
          value: formatMonth(application.details.fulfillmentDate),
        },
        {
          key: <FormattedMessage id="applications.type.earlyWithdrawal.account" />,
          value: application.details.depositAccountIBAN,
        },
      ]}
    />
  </BaseApplicationCard>
);

const WithdrawalCard: React.FunctionComponent<{
  application: WithdrawalApplication;
  allowedActions: ApplicationAction[];
}> = ({ application, allowedActions }) => (
  <BaseApplicationCard
    allowedActions={allowedActions}
    application={application}
    titleKey="applications.type.withdrawal.title"
  >
    <DefinitionList
      definitions={[
        {
          key: <FormattedMessage id="applications.type.withdrawal.time" />,
          value: formatMonth(application.details.fulfillmentDate),
        },
        {
          key: <FormattedMessage id="applications.type.earlyWithdrawal.account" />,
          value: application.details.depositAccountIBAN,
        },
      ]}
    />
  </BaseApplicationCard>
);

const StopContributionsCard: React.FunctionComponent<{
  application: StopContributionsApplication;
  allowedActions: ApplicationAction[];
}> = ({ application, allowedActions }) => (
  <BaseApplicationCard
    allowedActions={allowedActions}
    application={application}
    titleKey="applications.type.stopContributions.title"
  >
    <DefinitionList
      definitions={[
        {
          key: <FormattedMessage id="applications.type.stopContributions.time" />,
          value: formatDate(application.details.stopTime),
        },
        {
          key: <FormattedMessage id="applications.type.stopContributions.resumeTime" />,
          value: formatDate(application.details.earliestResumeTime),
        },
      ]}
    />
  </BaseApplicationCard>
);

const ResumeContributionsCard: React.FunctionComponent<{
  application: ResumeContributionsApplication;
  allowedActions: ApplicationAction[];
}> = ({ application, allowedActions }) => (
  <BaseApplicationCard
    allowedActions={allowedActions}
    application={application}
    titleKey="applications.type.resumeContributions.title"
  >
    <DefinitionList
      definitions={[
        {
          key: <FormattedMessage id="applications.type.resumeContributions.time" />,
          value: formatDate(application.details.resumeTime),
        },
      ]}
    />
  </BaseApplicationCard>
);

const BaseApplicationCard: React.FunctionComponent<{
  titleKey: string;
  application: Application;
  children: React.ReactNode;
  allowedActions: ApplicationAction[];
}> = ({ application, titleKey, children, allowedActions }) => {
  const cancellationUrl = `/applications/${application.id}/cancellation`;
  const isBeforeCancellationDeadline = moment().isSameOrBefore(
    moment(application.details.cancellationDeadline),
    'day',
  );
  const canCancel =
    isBeforeCancellationDeadline && allowedActions.includes(ApplicationAction.CANCEL);
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className="d-flex">
          <b className="mr-3">
            <FormattedMessage id={titleKey} />
          </b>
          {formatDate(application.creationTime)}
        </div>
        {canCancel && (
          <Link to={cancellationUrl} className="btn btn-light d-none d-md-block ml-2">
            <FormattedMessage id="applications.cancel" />
          </Link>
        )}
      </div>
      <div className={styles.content}>{children}</div>
      {canCancel && (
        <div className={`${styles.footer} d-md-none`}>
          <Link to={cancellationUrl} className="btn btn-light">
            <FormattedMessage id="applications.cancel" />
          </Link>
        </div>
      )}
    </div>
  );
};

export enum ApplicationAction {
  CANCEL = 'CANCEL',
}

function formatDate(date: string): string {
  return moment(date).format('DD.MM.YYYY');
}

function formatMonth(date: string): string {
  return moment(date).format('MM.YYYY');
}
