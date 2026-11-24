import moment from 'moment';
import { CapitalEvent, CapitalType } from '../../apiModels';

const event = (daysAgo: number, type: CapitalType, value: number): CapitalEvent => ({
  date: moment().subtract(daysAgo, 'days').format('YYYY-MM-DD'),
  type,
  value,
  currency: 'EUR',
});

export const capitalEventsProfiles: Record<string, CapitalEvent[]> = {
  NONE: [],
  ALL_TYPES: [
    event(900, 'CAPITAL_PAYMENT', 500),
    event(800, 'WORK_COMPENSATION', 6000),
    event(700, 'MEMBERSHIP_BONUS', 25),
    event(500, 'CAPITAL_PAYMENT', 500),
    event(400, 'WORK_COMPENSATION', 4000),
    event(330, 'MEMBERSHIP_BONUS', 25),
    event(60, 'UNVESTED_WORK_COMPENSATION', 1000),
    event(30, 'CAPITAL_ACQUIRED', 30),
  ],
  ONLY_MEMBERSHIP: [event(700, 'MEMBERSHIP_BONUS', 25), event(330, 'MEMBERSHIP_BONUS', 25)],
};
