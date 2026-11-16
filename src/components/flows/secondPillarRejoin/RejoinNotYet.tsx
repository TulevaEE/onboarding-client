import moment from 'moment';
import { FormattedMessage, useIntl } from 'react-intl';
import { formatMonth } from '../../common/dateFormatter';
import { RejoinRefused } from './RejoinRefused';
import styles from './RejoinNotYet.module.scss';
import { calendarFile, googleCalendarEvent, morningBeforeDeadline } from './calendarReminder';

const MONTHS_THE_WINDOW_STAYS_OPEN = 3;
const MONTHS_FROM_WINDOW_TO_CONTRIBUTIONS = 9;
const YEARS_WITHOUT_CONTRIBUTIONS = 5;
const DAY = 'YYYY-MM-DD';

export const opensFilingWindow = (day: string) => /-(12|04|08)-01$/.test(day);

export const RejoinNotYet = ({ filingOpens }: { filingOpens: string }) => {
  const { formatMessage } = useIntl();
  const lastFilingMonth = moment(filingOpens).add(MONTHS_THE_WINDOW_STAYS_OPEN, 'months');
  const restart = moment(filingOpens).add(MONTHS_FROM_WINDOW_TO_CONTRIBUTIONS, 'months');
  const ended = restart.clone().subtract(YEARS_WITHOUT_CONTRIBUTIONS, 'years');
  const reminder = {
    startsAt: morningBeforeDeadline(lastFilingMonth.clone().endOf('month').format(DAY)),
    title: formatMessage({ id: 'secondPillarRejoin.notYet.reminder.title' }),
    details: formatMessage(
      { id: 'secondPillarRejoin.notYet.reminder.details' },
      { url: `${window.location.origin}/2nd-pillar-rejoin` },
    ),
  };

  return (
    <RejoinRefused
      details={
        <ol
          className={styles.timeline}
          aria-label={formatMessage({ id: 'secondPillarRejoin.notYet.timeline' })}
        >
          <li className={styles.past}>
            <span className={styles.caption}>
              <FormattedMessage id="secondPillarRejoin.notYet.ended" />
            </span>{' '}
            <span className={styles.date}>{formatMonth(ended.format(DAY))}</span>
          </li>
          <li className={styles.now}>
            <span className={styles.caption}>
              <FormattedMessage id="secondPillarRejoin.notYet.apply" />
            </span>{' '}
            <span className={styles.date}>
              {lastFilingMonth.isSame(filingOpens, 'year')
                ? moment(filingOpens).format('MMMM')
                : formatMonth(filingOpens)}
              {'\u00A0– '}
              {formatMonth(lastFilingMonth.format(DAY))}
            </span>
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
      <FormattedMessage id="secondPillarRejoin.notYet.lead" />
    </RejoinRefused>
  );
};
