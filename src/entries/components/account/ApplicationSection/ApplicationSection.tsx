import React, { Fragment } from 'react';
import { Message } from 'retranslate';
import moment from 'moment';
import styles from './ApplicationSection.module.scss';
import {
  Application,
  ApplicationType,
  EarlyWithdrawalApplication,
  StopContributionsApplication,
  WithdrawalApplication,
} from '../../common/api';

import { usePendingApplications } from '../../common/apiHooks';

// TODO: actually need to download funds separately

export const ApplicationSection: React.FunctionComponent = () => {
  const applications = usePendingApplications();
  return applications && applications.length ? (
    <section className="mt-5">
      <h2 className="mb-4 lead">
        <Message>applications.title</Message>
      </h2>
      {applications.map((application) => (
        <ApplicationCard key={application.id} application={application} />
      ))}
      <div className="mt-2">
        <small className="text-muted">
          <Message>applications.footer</Message>
        </small>
      </div>
    </section>
  ) : (
    <></>
  );
};

const ApplicationCard: React.FunctionComponent<{ application: Application }> = ({
  application,
}) => {
  switch (application.type) {
    case ApplicationType.EARLY_WITHDRAWAL:
      return <EarlyWithdrawalCard application={application} />;
    case ApplicationType.WITHDRAWAL:
      return <WithdrawalCard application={application} />;
    case ApplicationType.STOP_CONTRIBUTIONS:
      return <StopContributionsCard application={application} />;
    case ApplicationType.EXCHANGE:
    case ApplicationType.RESUME_CONTRIBUTIONS:
    default:
      return <></>;
  }
};

// TODO: gotta refactor

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
          value: moment(application.details.withdrawalTime).format('MM.YYYY'),
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
          value: moment(application.details.withdrawalTime).format('MM.YYYY'),
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
          value: moment(application.details.stopTime).format('DD.MM.YYYY'),
        },
        {
          key: <Message>applications.type.stopContributions.resumeTime</Message>,
          value: moment(application.details.earliestResumeTime).format('DD.MM.YYYY'),
        },
      ]}
    />
  </BaseApplicationCard>
);

const DefinitionList: React.FunctionComponent<{
  definitions: { key: React.ReactNode; value: React.ReactNode }[];
}> = ({ definitions }) => (
  <dl className={styles.definitions}>
    {definitions.map(({ key, value }, index) => (
      // eslint-disable-next-line react/no-array-index-key
      <Fragment key={index}>
        <dt>{key}</dt>
        <dd>{value}</dd>
      </Fragment>
    ))}
  </dl>
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
          {moment(creationTime).format('DD.MM.YYYY')}
        </div>
        <button type="button" className="btn btn-light d-none d-md-block ml-2">
          <Message>applications.cancel</Message>
        </button>
      </div>
      <div className={styles.content}>{children}</div>
      <div className={`${styles.footer} d-md-none`}>
        <button type="button" className="btn btn-light">
          <Message>applications.cancel</Message>
        </button>
      </div>
    </div>
  );
};
