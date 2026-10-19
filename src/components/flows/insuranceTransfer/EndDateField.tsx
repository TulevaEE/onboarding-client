import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { todayInTallinn } from '../../common/dateFormatter';

const END_DATE_ID = 'insurance-contract-end-date';

export const EndDateField = ({
  endDate,
  onChange,
}: {
  endDate: string | null;
  onChange: (endDate: string | null) => void;
}) => {
  const today = todayInTallinn();
  const laterThanToday = (date: string) => (date > today ? date : null);
  const [shownDate, showDate] = useState(endDate ?? today);

  return (
    <div className="mt-4">
      <label className="form-label fw-bold" htmlFor={END_DATE_ID}>
        <FormattedMessage id="insuranceTransfer.endDate.label" />
      </label>
      <input
        type="date"
        id={END_DATE_ID}
        className="form-control w-auto"
        value={shownDate}
        min={today}
        onChange={(event) => {
          showDate(event.target.value);
          onChange(laterThanToday(event.target.value));
        }}
        onBlur={() => showDate(laterThanToday(shownDate) ?? today)}
        aria-describedby={`${END_DATE_ID}-hint`}
      />
      <div id={`${END_DATE_ID}-hint`} className="form-text text-pretty">
        <FormattedMessage id="insuranceTransfer.endDate.hint" />
      </div>
    </div>
  );
};
