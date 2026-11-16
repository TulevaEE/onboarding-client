import moment from 'moment';
import { FormattedMessage, useIntl } from 'react-intl';
import { dayInTallinn, formatMonth, todayInTallinn } from '../../common/dateFormatter';
import { useCompletedApplications } from '../../common/apiHooks';
import { Application } from '../../common/apiModels';
import Loader from '../../common/loader';
import { RejoinRefused } from './RejoinRefused';
import { RejoinRefusalReason } from './RejoinRefusalReason';
import styles from './RejoinNotYet.module.scss';
import { calendarFile, googleCalendarEvent, morningBeforeDeadline } from './calendarReminder';

const MONTHS_THE_WINDOW_STAYS_OPEN = 3;
const MONTHS_FROM_WINDOW_TO_CONTRIBUTIONS = 9;
const YEARS_WITHOUT_CONTRIBUTIONS = 5;
const DAY = 'YYYY-MM-DD';

export const opensFilingWindow = (day: string) => /-(12|04|08)-01$/.test(day);

const monthRange = (first: moment.Moment, last: moment.Moment) => (
  <>
    {last.isSame(first, 'year') ? first.format('MMMM') : formatMonth(first.format(DAY))}
    {'\u00A0– '}
    {formatMonth(last.format(DAY))}
  </>
);

const WaitLead = ({ filingOpens, today }: { filingOpens: string; today: string }) => (
  <FormattedMessage
    id="secondPillarRejoin.notYet.lead"
    values={{ yearsAhead: Number(filingOpens.slice(0, 4)) - Number(today.slice(0, 4)) }}
  />
);

const withdrawalFiledBetween = (
  applications: Application[] | undefined,
  firstMonth: moment.Moment,
  lastMonth: moment.Moment,
) =>
  applications?.find(
    (application) =>
      application.type === 'EARLY_WITHDRAWAL' &&
      moment(dayInTallinn(application.creationTime)).isBetween(
        firstMonth.clone().startOf('month'),
        lastMonth.clone().endOf('month'),
        'day',
        '[]',
      ),
  );

export const RejoinNotYet = ({ filingOpens }: { filingOpens: string }) => {
  const { formatMessage } = useIntl();
  const today = todayInTallinn();
  const { data: completedApplications, isLoading } = useCompletedApplications();
  const lastFilingMonth = moment(filingOpens).add(MONTHS_THE_WINDOW_STAYS_OPEN, 'months');
  const restart = moment(filingOpens).add(MONTHS_FROM_WINDOW_TO_CONTRIBUTIONS, 'months');
  const ended = restart.clone().subtract(YEARS_WITHOUT_CONTRIBUTIONS, 'years');
  const firstMonthToLeave = moment(filingOpens).subtract(YEARS_WITHOUT_CONTRIBUTIONS, 'years');
  const lastMonthToLeave = lastFilingMonth.clone().subtract(YEARS_WITHOUT_CONTRIBUTIONS, 'years');
  const withdrawal = withdrawalFiledBetween(
    completedApplications,
    firstMonthToLeave,
    lastMonthToLeave,
  );
  const reminder = {
    startsAt: morningBeforeDeadline(lastFilingMonth.clone().endOf('month').format(DAY)),
    title: formatMessage({ id: 'secondPillarRejoin.notYet.reminder.title' }),
    details: formatMessage(
      { id: 'secondPillarRejoin.notYet.reminder.details' },
      { url: `${window.location.origin}/2nd-pillar-rejoin` },
    ),
  };

  if (isLoading) {
    return <Loader className="align-middle my-4" />;
  }

  if (!withdrawal) {
    return (
      <RejoinRefused>
        <RejoinRefusalReason
          decision="REFUSED_BY_PENSIONIKESKUS"
          rejoinPossibleFrom={filingOpens}
        />
      </RejoinRefused>
    );
  }

  return (
    <RejoinRefused
      details={
        <ol
          className={styles.timeline}
          aria-label={formatMessage({ id: 'secondPillarRejoin.notYet.timeline' })}
        >
          <li className={styles.past}>
            <span className={styles.caption}>
              <FormattedMessage id="secondPillarRejoin.notYet.left" />
            </span>{' '}
            <span className={styles.date}>
              {formatMonth(dayInTallinn(withdrawal.creationTime))}
            </span>
          </li>
          <li className={styles.past}>
            <span className={styles.caption}>
              <FormattedMessage id="secondPillarRejoin.notYet.ended" />
            </span>{' '}
            <span className={styles.date}>{formatMonth(ended.format(DAY))}</span>
          </li>
          <li className={styles.today} aria-current="date">
            <span className={styles.caption}>
              <FormattedMessage id="secondPillarRejoin.notYet.today" />
            </span>{' '}
            <span className={styles.date}>{formatMonth(today)}</span>
          </li>
          <li className={styles.next}>
            <span className={styles.caption}>
              <FormattedMessage id="secondPillarRejoin.notYet.apply" />
            </span>{' '}
            <span className={styles.date}>{monthRange(moment(filingOpens), lastFilingMonth)}</span>
            <span className={styles.reminder}>
              <FormattedMessage id="secondPillarRejoin.notYet.reminder" />{' '}
              <a href={googleCalendarEvent(reminder)} target="_blank" rel="noopener noreferrer">
                Google Calendar
              </a>
              <span aria-hidden="true"> · </span>
              <a href={calendarFile(reminder)} download="tuleva-ii-sammas.ics">
                iCal
              </a>
            </span>
          </li>
          <li className={styles.future}>
            <span className={styles.caption}>
              <FormattedMessage id="secondPillarRejoin.notYet.restart" />
            </span>{' '}
            <span className={styles.date}>{formatMonth(restart.format(DAY))}</span>
          </li>
        </ol>
      }
    >
      <WaitLead filingOpens={filingOpens} today={today} />
    </RejoinRefused>
  );
};
