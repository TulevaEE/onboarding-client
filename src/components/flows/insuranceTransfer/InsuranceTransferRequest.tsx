import { FormattedMessage } from 'react-intl';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { captureException } from '@sentry/browser';
import { useMe } from '../../common/apiHooks';
import { createTrackedEvent } from '../../common/api';
import { User } from '../../common/apiModels';
import { Shimmer } from '../../common/shimmer/Shimmer';
import Radio from '../../common/radio';
import { ACCOUNT_PATH } from '../../paths';
import { INSURER_CODES, InsurerCode, insurers, toInsurerCode } from './insurers';
import { InsurerGuide } from './InsurerGuide';
import { useTransferRequest } from './useTransferRequest';

const INSURER_PARAMETER = 'insurer';
const CONFIRM_PARAMETER = 'confirm';

const useChosenInsurer = (): [InsurerCode | null, (insurer: InsurerCode) => void] => {
  const { search } = useLocation();
  const history = useHistory();
  const parameters = new URLSearchParams(search);

  const choose = (insurer: InsurerCode) => {
    parameters.set(INSURER_PARAMETER, insurer);
    history.replace({ search: parameters.toString() });
  };

  return [toInsurerCode(parameters.get(INSURER_PARAMETER)), choose];
};

const InsurerName = ({ insurer }: { insurer: InsurerCode }) => (
  <p className="m-0">
    {insurers[insurer].name}
    {insurer === 'ARTEA' && (
      <span className="text-body-secondary">
        {' '}
        (<FormattedMessage id="insuranceTransfer.insurer.ARTEA.formerNames" />)
      </span>
    )}
  </p>
);

const SentQuestion = ({ onSent }: { onSent: () => void }) => {
  const history = useHistory();
  return (
    <div className="text-center py-5">
      <h2 className="mb-4">
        <FormattedMessage id="insuranceTransfer.sentQuestion.title" />
      </h2>
      <div className="d-flex gap-2 justify-content-center flex-wrap">
        <button type="button" className="btn btn-primary" onClick={onSent}>
          <FormattedMessage id="insuranceTransfer.sentQuestion.yes" />
        </button>
        <button type="button" className="btn btn-outline-primary" onClick={() => history.goBack()}>
          <FormattedMessage id="insuranceTransfer.sentQuestion.showSteps" />
        </button>
      </div>
    </div>
  );
};

const NoPensionAccountNumberYet = () => (
  <>
    <p className="text-pretty">
      <FormattedMessage id="insuranceTransfer.noNumber" />
    </p>
    <Link className="btn btn-outline-primary mt-3" to={ACCOUNT_PATH}>
      <FormattedMessage id="thirdPillarSuccess.button.account" />
    </Link>
  </>
);

const RequestToInsurer = ({
  user,
  pensionAccountNumber,
  nextPath,
}: {
  user: User;
  pensionAccountNumber: string;
  nextPath: string;
}) => {
  const history = useHistory();
  const { search } = useLocation();
  const [insurer, chooseInsurer] = useChosenInsurer();
  const request = useTransferRequest(user, pensionAccountNumber);
  const askingIfSent = new URLSearchParams(search).has(CONFIRM_PARAMETER);

  const askIfSent = () => {
    const parameters = new URLSearchParams(search);
    parameters.set(CONFIRM_PARAMETER, '1');
    history.push({ search: parameters.toString() });
  };

  const recordSent = (sentTo: InsurerCode) => {
    createTrackedEvent('CLICK', { target: 'insurance-transfer-sent', insurer: sentTo }).catch(
      captureException,
    );
    history.push(nextPath);
  };

  if (askingIfSent && insurer) {
    return <SentQuestion onSent={() => recordSent(insurer)} />;
  }

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
            <InsurerGuide insurer={insurer} request={request} />
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

export const InsuranceTransferRequest = ({ nextPath }: { nextPath: string }) => {
  const { data: user, isFetching } = useMe();

  if (!user || (isFetching && !user.pensionAccountNumber)) {
    return <Shimmer height={500} />;
  }

  if (!user.pensionAccountNumber) {
    return <NoPensionAccountNumberYet />;
  }

  return (
    <RequestToInsurer
      user={user}
      pensionAccountNumber={user.pensionAccountNumber}
      nextPath={nextPath}
    />
  );
};
