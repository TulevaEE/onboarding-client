import { FormattedMessage } from 'react-intl';
import { useHistory, useLocation } from 'react-router-dom';
import { useMe } from '../../common/apiHooks';
import { User } from '../../common/apiModels';
import { Shimmer } from '../../common/shimmer/Shimmer';
import Radio from '../../common/radio';
import { INSURER_CODES, InsurerCode, insurers, toInsurerCode } from './insurers';
import { InsurerGuide } from './InsurerGuide';
import { useTransferRequest } from './useTransferRequest';
import { LoadFailed } from './LoadFailed';
import { sentPath } from './insuranceTransferPaths';

const INSURER_PARAMETER = 'insurer';
const END_DATE_PARAMETER = 'endDate';

const useRequestChoicesInAddress = () => {
  const { search } = useLocation();
  const history = useHistory();
  const parameters = new URLSearchParams(search);

  const replaceParameter = (name: string, value: string | null) => {
    const changed = new URLSearchParams(search);
    if (value) {
      changed.set(name, value);
    } else {
      changed.delete(name);
    }
    history.replace({ search: changed.toString() });
  };

  return {
    insurer: toInsurerCode(parameters.get(INSURER_PARAMETER)),
    endDate: parameters.get(END_DATE_PARAMETER),
    chooseInsurer: (insurer: InsurerCode) => replaceParameter(INSURER_PARAMETER, insurer),
    chooseEndDate: (endDate: string | null) => replaceParameter(END_DATE_PARAMETER, endDate),
    askIfSent: () => history.push({ pathname: sentPath, search }),
  };
};

const InsurerName = ({ insurer }: { insurer: InsurerCode }) => {
  const { name, formerNamesMessageId } = insurers[insurer];
  return (
    <p className="m-0">
      {name}
      {formerNamesMessageId && (
        <span className="text-body-secondary">
          {' '}
          (<FormattedMessage id={formerNamesMessageId} />)
        </span>
      )}
    </p>
  );
};

const END_DATE_ID = 'insurance-contract-end-date';

const EndDateField = ({
  endDate,
  onChange,
}: {
  endDate: string | null;
  onChange: (endDate: string | null) => void;
}) => (
  <div className="mt-4">
    <label className="form-label fw-bold" htmlFor={END_DATE_ID}>
      <FormattedMessage id="insuranceTransfer.endDate.label" />
    </label>
    <input
      type="date"
      id={END_DATE_ID}
      className="form-control w-auto"
      value={endDate ?? ''}
      onChange={(event) => onChange(event.target.value || null)}
      aria-describedby={`${END_DATE_ID}-hint`}
    />
    <div id={`${END_DATE_ID}-hint`} className="form-text text-pretty">
      <FormattedMessage id="insuranceTransfer.endDate.hint" />
    </div>
  </div>
);

const RequestToInsurer = ({ user }: { user: User }) => {
  const { insurer, endDate, chooseInsurer, chooseEndDate, askIfSent } =
    useRequestChoicesInAddress();
  const request = useTransferRequest(user, endDate);

  return (
    <div className="row">
      <div className="col-lg-8">
        <fieldset>
          <legend className="h5 mb-3">
            <FormattedMessage id="insuranceTransfer.request.question" />
          </legend>
          <div className="d-flex flex-column gap-2">
            {INSURER_CODES.map((code) => (
              <Radio
                key={code}
                name="insurer"
                id={`insurer-${code}`}
                className="py-3"
                selected={insurer === code}
                onSelect={() => chooseInsurer(code)}
              >
                <InsurerName insurer={code} />
              </Radio>
            ))}
          </div>
        </fieldset>

        {insurer && (
          <>
            <p className="mt-3 mb-0 text-body-secondary text-pretty">
              <FormattedMessage id="insuranceTransfer.fairness" />
            </p>
            <EndDateField endDate={endDate} onChange={chooseEndDate} />
            <InsurerGuide insurer={insurer} request={request} onSend={askIfSent} />
            <div className="mt-4 d-flex flex-column flex-sm-row justify-content-end">
              <a
                className="btn btn-primary btn-lg"
                href={insurers[insurer].actionUrl}
                target="_blank"
                rel="noreferrer"
                onClick={askIfSent}
              >
                <FormattedMessage id={`insuranceTransfer.open.${insurer}`} />
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const InsuranceTransferRequest = () => {
  const { data: user, isFetching, isError } = useMe();

  if (!user) {
    return isError ? <LoadFailed /> : <Shimmer height={500} />;
  }

  if (isFetching && !user.pensionAccountNumber) {
    return <Shimmer height={500} />;
  }

  return <RequestToInsurer user={user} />;
};
