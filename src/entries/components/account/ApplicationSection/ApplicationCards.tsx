import React from 'react';
import moment from 'moment';
import { Message } from 'retranslate';
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
} from '../../common/api';

export const ApplicationCard: React.FunctionComponent<{ application: Application }> = ({
  application,
}) => {
  switch (application.type) {
    case ApplicationType.EARLY_WITHDRAWAL:
      return <EarlyWithdrawalCard application={application} />;
    case ApplicationType.WITHDRAWAL:
      return <WithdrawalCard application={application} />;
    case ApplicationType.STOP_CONTRIBUTIONS:
      return <StopContributionsCard application={application} />;
    case ApplicationType.RESUME_CONTRIBUTIONS:
      return <ResumeContributionsCard application={application} />;
    case ApplicationType.TRANSFER:
      return <TransferApplicationCard application={application} />;
    default:
      return <></>;
  }
};

const TransferApplicationCard: React.FunctionComponent<{
  application: TransferApplication;
}> = ({ application }) => (
  <BaseApplicationCard
    title={<Message>applications.type.transfer.title</Message>}
    creationTime={application.creationTime}
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

const EarlyWithdrawalCard: React.FunctionComponent<{ application: EarlyWithdrawalApplication }> = ({
  application,
}) => (
  <BaseApplicationCard
    title={<Message>applications.type.earlyWithdrawal.title</Message>}
    creationTime={application.creationTime}
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

const WithdrawalCard: React.FunctionComponent<{ application: WithdrawalApplication }> = ({
  application,
}) => (
  <BaseApplicationCard
    title={<Message>applications.type.withdrawal.title</Message>}
    creationTime={application.creationTime}
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
}> = ({ application }) => (
  <BaseApplicationCard
    title={<Message>applications.type.stopContributions.title</Message>}
    creationTime={application.creationTime}
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
}> = ({ application }) => (
  <BaseApplicationCard
    title={<Message>applications.type.resumeContributions.title</Message>}
    creationTime={application.creationTime}
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
  creationTime: string;
  children: React.ReactNode;
}> = ({ title, creationTime, children }) => {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className="d-flex">
          <b className="mr-3">{title}</b>
          {formatDate(creationTime)}
        </div>
        {/* <button type="button" className="btn btn-light d-none d-md-block ml-2">
          <Message>applications.cancel</Message>
        </button>
        */}
      </div>
      <div className={styles.content}>{children}</div>
      {/* <div className={`${styles.footer} d-md-none`}>
        <button type="button" className="btn btn-light">
          <Message>applications.cancel</Message>
        </button>
      </div>
      */}
    </div>
  );
};

function formatDate(date: string): string {
  return moment(date).format('DD.MM.YYYY');
}

function formatMonth(date: string): string {
  return moment(date).format('MM.YYYY');
}
