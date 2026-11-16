import { ReactNode } from 'react';
import moment from 'moment';

export const highlightedDeadline = (chunks: ReactNode) => (
  <b className="highlight text-body text-nowrap">{chunks}</b>
);

export const contributionStartMonth = (contributionStartDate: string) =>
  moment(contributionStartDate).month() + 1;
