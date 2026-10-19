import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useHistory, useLocation } from 'react-router-dom';
import { PII_CLASS } from '../../tracking/piiMarkup';
import { useMe } from '../../common/apiHooks';
import { User } from '../../common/apiModels';
import { Shimmer } from '../../common/shimmer/Shimmer';
import Radio from '../../common/radio';
import {
  GuidedInsurerCode,
  guides,
  INSURER_CODES,
  InsurerCode,
  insurers,
  takesSignedForm,
  toInsurerCode,
} from './insurers';
import { InsurerGuide } from './InsurerGuide';
import { InsurerForm } from './InsurerForm';
import { EndDateField } from './EndDateField';
import { PersonWithPensionAccount, useTransferRequest } from './useTransferRequest';
import { LoadFailed } from './LoadFailed';
import { sentPath } from './insuranceTransferPaths';

const INSURER_PARAMETER = 'insurer';
const END_DATE_PARAMETER = 'endDate';

type RequestState = { contractNumber?: string } | undefined;

const useRequestChoicesInAddress = () => {
  const { search, state } = useLocation<RequestState>();
  const history = useHistory();
  const parameters = new URLSearchParams(search);

  const replaceParameter = (name: string, value: string | null) => {
    const changed = new URLSearchParams(search);
    if (value) {
      changed.set(name, value);
    } else {
      changed.delete(name);
    }
    history.replace({ search: changed.toString(), state });
  };

  return {
    insurer: toInsurerCode(parameters.get(INSURER_PARAMETER)),
    endDate: parameters.get(END_DATE_PARAMETER),
    savedContractNumber: state?.contractNumber ?? '',
    chooseInsurer: (insurer: InsurerCode) => replaceParameter(INSURER_PARAMETER, insurer),
    chooseEndDate: (endDate: string | null) => replaceParameter(END_DATE_PARAMETER, endDate),
    saveContractNumber: (contractNumber: string) =>
      history.replace({ search, state: { contractNumber } }),
    askIfSent: () => history.push({ pathname: sentPath, search, state }),
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

const CONTRACT_NUMBER_ID = 'insurance-contract-number';

const ContractNumberField = ({
  contractNumber,
  onChange,
}: {
  contractNumber: string;
  onChange: (contractNumber: string) => void;
}) => (
  <div className="mt-4">
    <label className="form-label fw-bold" htmlFor={CONTRACT_NUMBER_ID}>
      <FormattedMessage id="insuranceTransfer.contractNumber.label" />
    </label>
    <input
      type="text"
      id={CONTRACT_NUMBER_ID}
      className={`form-control w-auto ${PII_CLASS}`}
      value={contractNumber}
      onChange={(event) => onChange(event.target.value)}
      spellCheck={false}
      autoCapitalize="characters"
      aria-describedby={`${CONTRACT_NUMBER_ID}-hint`}
    />
    <div id={`${CONTRACT_NUMBER_ID}-hint`} className="form-text text-pretty">
      <FormattedMessage id="insuranceTransfer.contractNumber.hint" />
    </div>
  </div>
);

const GuidedRequest = ({
  insurer,
  user,
  endDate,
  chooseEndDate,
  savedContractNumber,
  saveContractNumber,
  askIfSent,
}: {
  insurer: GuidedInsurerCode;
  user: PersonWithPensionAccount;
  endDate: string | null;
  chooseEndDate: (endDate: string | null) => void;
  savedContractNumber: string;
  saveContractNumber: (contractNumber: string) => void;
  askIfSent: () => void;
}) => {
  const [contractNumber, setContractNumber] = useState(savedContractNumber);
  const request = useTransferRequest(user, endDate, contractNumber.trim() || null);
  const changeContractNumber = (changed: string) => {
    setContractNumber(changed);
    saveContractNumber(changed);
  };

  return (
    <>
      {guides[insurer].writesLetter && (
        <>
          <ContractNumberField contractNumber={contractNumber} onChange={changeContractNumber} />
          <EndDateField endDate={endDate} onChange={chooseEndDate} />
        </>
      )}
      <InsurerGuide
        insurer={insurer}
        request={request}
        pensionAccountNumber={user.pensionAccountNumber}
      />
      <div className="mt-4 d-flex flex-column flex-sm-row justify-content-end">
        <a
          className="btn btn-primary btn-lg"
          href={guides[insurer].actionUrl}
          target="_blank"
          rel="noreferrer"
          onClick={askIfSent}
        >
          <FormattedMessage id={`insuranceTransfer.open.${insurer}`} />
        </a>
      </div>
    </>
  );
};

const RequestToInsurer = ({ user }: { user: PersonWithPensionAccount }) => {
  const {
    insurer,
    endDate,
    savedContractNumber,
    chooseInsurer,
    chooseEndDate,
    saveContractNumber,
    askIfSent,
  } = useRequestChoicesInAddress();
  const [reviewing, setReviewing] = useState(false);
  const showReview = (shown: boolean) => {
    setReviewing(shown);
    window.scrollTo(0, 0);
  };

  return (
    <div className="row">
      <div className="col-lg-8">
        {!reviewing && (
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
        )}

        {insurer &&
          (takesSignedForm(insurer) ? (
            <InsurerForm
              insurer={insurer}
              endDate={endDate}
              chooseEndDate={chooseEndDate}
              user={user}
              reviewing={reviewing}
              review={() => showReview(true)}
              editAnswers={() => showReview(false)}
            />
          ) : (
            <GuidedRequest
              insurer={insurer}
              user={user}
              endDate={endDate}
              chooseEndDate={chooseEndDate}
              savedContractNumber={savedContractNumber}
              saveContractNumber={saveContractNumber}
              askIfSent={askIfSent}
            />
          ))}
      </div>
    </div>
  );
};

const hasPensionAccount = (user: User): user is PersonWithPensionAccount =>
  !!user.pensionAccountNumber;

const usePersonWithPensionAccount = () => {
  const { data: user, isFetchedAfterMount, isError } = useMe();

  if (user && hasPensionAccount(user)) {
    return { person: user, failed: false };
  }
  return { person: null, failed: isFetchedAfterMount && (isError || !!user) };
};

export const InsuranceTransferRequest = () => {
  const { person, failed } = usePersonWithPensionAccount();

  if (failed) {
    return <LoadFailed />;
  }

  if (!person) {
    return <Shimmer height={500} />;
  }

  return <RequestToInsurer user={person} />;
};
