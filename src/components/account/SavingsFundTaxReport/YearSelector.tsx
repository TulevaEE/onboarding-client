import React from 'react';
import { FormattedMessage } from 'react-intl';
import { PillButton } from '../../common/PillButton';

export const YearSelector: React.FunctionComponent<{
  taxYears: number[];
  year: number;
  onYearChange: (year: number) => void;
}> = ({ taxYears, year, onYearChange }) => (
  <div className="d-flex flex-wrap gap-2 align-items-center">
    <span className="text-body-secondary me-1">
      <FormattedMessage id="savingsFund.statement.tax.year" />
    </span>
    {taxYears.map((taxYear) => (
      <PillButton key={taxYear} selected={year === taxYear} onClick={() => onYearChange(taxYear)}>
        {taxYear}
      </PillButton>
    ))}
  </div>
);
