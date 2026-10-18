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

  return (
    <div className="mt-4">
      <label className="form-label fw-bold" htmlFor={END_DATE_ID}>
        <FormattedMessage id="insuranceTransfer.endDate.label" />
      </label>
      <input
        type="date"
        id={END_DATE_ID}
        className="form-control w-auto"
        value={endDate ?? today}
        min={today}
        onChange={(event) => onChange(laterThanToday(event.target.value))}
        aria-describedby={`${END_DATE_ID}-hint`}
      />
      <div id={`${END_DATE_ID}-hint`} className="form-text text-pretty">
        <FormattedMessage id="insuranceTransfer.endDate.hint" />
      </div>
    </div>
  );
};
