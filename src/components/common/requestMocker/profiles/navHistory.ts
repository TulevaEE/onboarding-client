import moment from 'moment';
import { NavValue } from '../../apiModels';

const daily = (days: number, startValue: number, dailyGrowth: number): NavValue[] =>
  Array.from({ length: days }, (unused, index) => ({
    date: moment()
      .subtract(days - 1 - index, 'day')
      .format('YYYY-MM-DD'),
    value: Number((startValue * (1 + dailyGrowth) ** index).toFixed(5)),
  }));

export const navHistoryProfiles: Record<string, NavValue[]> = {
  STEADY_GROWTH: daily(900, 10, 0.0003),
  FLAT: daily(900, 10, 0),
  EMPTY: [],
};
