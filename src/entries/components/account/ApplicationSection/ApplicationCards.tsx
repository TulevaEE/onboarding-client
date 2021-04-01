import React from 'react';
import moment from 'moment';
import { Message } from 'retranslate';
import { Link } from 'react-router-dom';
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
    title={<Message>applications.type.transfer.title</Message>}
  >
    <DefinitionList
      definitions={[
        {
          key: <Message>applications.type.transfer.sourceFund</Message>,
          value: application.details.sourceFund.name,
        },
        application.details.exchanges.map(({ targetFund: { name }, amount }) => [
          { key: <Message>applications.type.transfer.targetFund</Message>, value: name },
          {
            key: <Message>applications.type.transfer.amount</Message>,
            value: `${amount * 100}%`,
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
    title={<Message>applications.type.earlyWithdrawal.title</Message>}
  >
    <DefinitionList
      definitions={[
        {
          key: <Message>applications.type.earlyWithdrawal.time</Message>,
          value: formatMonth(application.details.withdrawalTime),
        },
        {
          key: <Message>applications.type.earlyWithdrawal.account</Message>,
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
    title={<Message>applications.type.withdrawal.title</Message>}
  >
    <DefinitionList
      definitions={[
        {
          key: <Message>applications.type.withdrawal.time</Message>,
          value: formatMonth(application.details.withdrawalTime),
        },
        {
          key: <Message>applications.type.earlyWithdrawal.account</Message>,
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
    title={<Message>applications.type.stopContributions.title</Message>}
  >
    <DefinitionList
      definitions={[
        {
          key: <Message>applications.type.stopContributions.time</Message>,
          value: formatDate(application.details.stopTime),
        },
        {
          key: <Message>applications.type.stopContributions.resumeTime</Message>,
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
    title={<Message>applications.type.resumeContributions.title</Message>}
  >
    <DefinitionList
      definitions={[
        {
          key: <Message>applications.type.resumeContributions.time</Message>,
          value: formatDate(application.details.resumeTime),
        },
      ]}
    />
  </BaseApplicationCard>
);

const BaseApplicationCard: React.FunctionComponent<{
  title: React.ReactNode;
  application: Application;
  children: React.ReactNode;
  allowedActions: ApplicationAction[];
}> = ({ application, title, children, allowedActions }) => {
  const cancellationUrl = `/applications/${application.id}/cancellation`;
  const isBeforeCancellationDeadline = moment().isSameOrBefore(
    moment(application.cancellationDeadline),
    'day',
  );
  const canCancel =
    isBeforeCancellationDeadline && allowedActions.includes(ApplicationAction.CANCEL);
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className="d-flex">
          <b className="mr-3">{title}</b>
          {formatDate(application.creationTime)}
        </div>
        {canCancel && (
          <Link to={cancellationUrl} className="btn btn-light d-none d-md-block ml-2">
            <Message>applications.cancel</Message>
          </Link>
        )}
      </div>
      <div className={styles.content}>{children}</div>
      {canCancel && (
        <div className={`${styles.footer} d-md-none`}>
          <Link to={cancellationUrl} className="btn btn-light">
            <Message>applications.cancel</Message>
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
