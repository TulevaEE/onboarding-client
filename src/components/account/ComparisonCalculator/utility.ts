import { Fund } from '../../common/apiModels';

export function getFullYearsSince(dateString: string): number {
  const givenDate = new Date(dateString);
  const currentDate = new Date();
  const millisecondsDifference = currentDate.getTime() - givenDate.getTime();
  const daysDifference = millisecondsDifference / (1000 * 60 * 60 * 24);
  const yearsDifference = daysDifference / 365.25;
  return Math.round(yearsDifference);
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
