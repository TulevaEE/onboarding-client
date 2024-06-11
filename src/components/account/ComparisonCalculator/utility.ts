import moment from 'moment';
import { Fund } from '../../common/apiModels';

export function getFullYearsSince(dateString: string): number {
  const givenDate = moment(dateString);
  const currentDate = moment();

  return currentDate.diff(givenDate, 'years');
}

export function isShortPeriod(dateString: string) {
  const givenDate = moment(dateString);
  const currentDate = moment();
  const yearsDifference = currentDate.diff(givenDate, 'years', true);

  return yearsDifference <= 3;
}

export function sortFundsWithTulevaFirst(funds: Fund[]): Fund[] {
  const tulevaFunds = funds.filter((fund) => fund.name.includes('Tuleva'));

  // Filter other funds and sort them alphabetically by name
  const otherFunds = funds
    .filter((fund) => !fund.name.includes('Tuleva'))
    .sort((a, b) => a.name.localeCompare(b.name));

  return [...tulevaFunds, ...otherFunds];
}

export function getCurrentPath(): string {
  return window.location.pathname.replace(/\/+$/g, '');
}
