import { useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import download from 'downloadjs';
import { AuthenticationLoader, ErrorMessage } from '../../common';
import { isSigningWithIdCard } from '../../common/authenticationManager';
import {
  createInsuranceTransferForm,
  downloadInsuranceTransferFormPreview,
} from '../../common/api';
import { useKycIdentity } from '../../common/apiHooks';
import { User } from '../../common/apiModels';
import {
  CreateInsuranceTransferFormCommand,
  InsuranceTransferForm,
  InsuranceTransferFormInsurer,
} from '../../common/apiModels/insurance-transfer';
import { isErrorResponse } from '../../common/errorResponse';
import { Shimmer } from '../../common/shimmer/Shimmer';
import { useSigning } from '../../common/signing/useSigning';
import { PII_CLASS } from '../../tracking/piiMarkup';
import { State } from '../../../types';
import { KycIdentity, PepSelfDeclaration } from '../savingsAccount/SavingsFundOnboarding/types.api';
import { ArteaQuestionnaire } from './ArteaQuestionnaire';
import { EndDateField } from './EndDateField';
import { TextField } from './formFields';
import { signedPath } from './insuranceTransferPaths';
import {
  asksUsPersonDeclaration,
  defaultValuesFrom,
  detailsOnFile,
  InsurerFormValues,
  policyNumberFormatOf,
  toCommand,
} from './insurerFormValues';
import { YourDetails } from './YourDetails';

type Props = {
  insurer: InsuranceTransferFormInsurer;
  endDate: string | null;
  chooseEndDate: (endDate: string | null) => void;
  user: User;
};

const POLICY_NUMBER_MAX_LENGTH = 40;
const PDF = 'application/pdf';
const PREVIEW_FILE_NAME = 'Tuleva_avaldus_eelvaade.pdf';

const showPdf = (pdf: Blob) => {
  const pdfAddress = URL.createObjectURL(new Blob([pdf], { type: PDF }));
  if (!window.open(pdfAddress, '_blank')) {
    URL.revokeObjectURL(pdfAddress);
    download(pdf, PREVIEW_FILE_NAME, PDF);
  }
};

const useFormFilledOnce = () => {
  const [filled, setFilled] = useState<{ command: string; form: InsuranceTransferForm } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const filling = useRef(false);
  const [failure, setFailure] = useState<unknown>(null);

  const formFor = async (command: CreateInsuranceTransferFormCommand) => {
    const commandKey = JSON.stringify(command);
    if (filled?.command === commandKey) {
      return filled.form;
    }
    const form = await createInsuranceTransferForm(command);
    setFilled({ command: commandKey, form });
    return form;
  };

  const withFilledForm = async (
    command: () => CreateInsuranceTransferFormCommand,
    use: (form: InsuranceTransferForm) => unknown,
  ) => {
    if (filling.current) {
      return;
    }
    filling.current = true;
    setBusy(true);
    setFailure(null);
    try {
      await use(await formFor(command()));
    } catch (error) {
      setFailure(error);
    } finally {
      filling.current = false;
      setBusy(false);
    }
  };

  return { withFilledForm, busy, failure, dismissFailure: () => setFailure(null) };
};

const PolicyNumberField = ({ insurer }: { insurer: InsuranceTransferFormInsurer }) => {
  const { formatMessage } = useIntl();
  const {
    register,
    formState: { errors },
  } = useFormContext<InsurerFormValues>();
  const format = policyNumberFormatOf(insurer);
  return (
    <TextField
      className="mt-4"
      id="insurance-contract-number"
      label={
        <span className="fw-bold">
          <FormattedMessage id="insuranceTransfer.contractNumber.label" />
        </span>
      }
      hint={<FormattedMessage id="insuranceTransfer.form.policyNumber.hint" />}
      registration={register('policyNumber', {
        validate: {
          required: (value) =>
            value.trim() !== '' ||
            formatMessage({ id: 'insuranceTransfer.form.policyNumber.required' }),
          inTheFormatTheFormHolds: (value) =>
            !format || format.holds(value) || formatMessage({ id: format.messageId }),
        },
      })}
      error={errors.policyNumber?.message}
      inputClassName={`w-auto ${PII_CLASS}`}
      autoCapitalize="characters"
      maxLength={POLICY_NUMBER_MAX_LENGTH}
    />
  );
};

const usePepDeclaredThisSession = (): PepSelfDeclaration | null => {
  const isPoliticallyExposed = useSelector((state: State) => state.aml.isPoliticallyExposed);
  if (isPoliticallyExposed === null) {
    return null;
  }
  return isPoliticallyExposed ? 'IS_PEP' : 'IS_NOT_PEP';
};

const NOT_US_PERSON_ID = 'insurer-form-not-us-person';
const NOT_US_PERSON_ERROR_ID = `${NOT_US_PERSON_ID}-error`;

const NotUsPersonConfirmation = () => {
  const { formatMessage } = useIntl();
  const {
    register,
    formState: { errors },
  } = useFormContext<InsurerFormValues>();
  const error = errors.notUsPerson?.message;
  return (
    <div className="form-check mt-4">
      <input
        type="checkbox"
        className={`form-check-input ${error ? 'is-invalid' : ''}`}
        id={NOT_US_PERSON_ID}
        aria-invalid={!!error}
        aria-describedby={error ? NOT_US_PERSON_ERROR_ID : undefined}
        {...register('notUsPerson', {
          required: formatMessage({ id: 'insuranceTransfer.form.notUsPerson.required' }),
        })}
      />
      <label className="form-check-label" htmlFor={NOT_US_PERSON_ID}>
        <FormattedMessage id="insuranceTransfer.form.notUsPerson" />
      </label>
      {error && (
        <div id={NOT_US_PERSON_ERROR_ID} className="invalid-feedback text-pretty">
          {error}
        </div>
      )}
    </div>
  );
};

const FilledInInsurerForm = ({
  insurer,
  endDate,
  chooseEndDate,
  user,
  identity,
}: Props & { identity: KycIdentity | undefined }) => {
  const history = useHistory();
  const pepDeclaredThisSession = usePepDeclaredThisSession();
  const [onFile] = useState(() => detailsOnFile(identity, pepDeclaredThisSession));
  const methods = useForm<InsurerFormValues>({
    defaultValues: defaultValuesFrom(identity, user, pepDeclaredThisSession),
  });
  const { withFilledForm, busy, failure, dismissFailure } = useFormFilledOnce();
  const { startSigning, cancelSigning, signed, loading, error, challengeCode } =
    useSigning<InsuranceTransferForm>('INSURANCE_TRANSFER_FORM');
  const [signingFormId, setSigningFormId] = useState<number | null>(null);

  useEffect(() => {
    if (signed && signingFormId) {
      history.push(`${signedPath}/${signingFormId}`);
    }
  }, [signed, signingFormId, history]);

  const commandFrom = (values: InsurerFormValues) => toCommand(insurer, endDate, values);

  const sign = (values: InsurerFormValues) =>
    withFilledForm(
      () => commandFrom(values),
      (form) => {
        setSigningFormId(form.id);
        startSigning(form);
      },
    );

  const preview = (values: InsurerFormValues) =>
    withFilledForm(
      () => commandFrom(values),
      async (form) => showPdf(await downloadInsuranceTransferFormPreview(form.id)),
    );

  const working = busy || loading || !!challengeCode;

  return (
    <FormProvider {...methods}>
      {(loading || challengeCode) && (
        <AuthenticationLoader
          signingWithIdCard={isSigningWithIdCard()}
          controlCode={challengeCode}
          onCancel={cancelSigning}
          overlayed
        />
      )}
      {error && <ErrorMessage errors={error.body} onCancel={cancelSigning} overlayed />}
      {!!failure && (
        <ErrorMessage
          errors={isErrorResponse(failure) ? failure.body : { errors: [] }}
          onCancel={dismissFailure}
          overlayed
        />
      )}

      <form onSubmit={methods.handleSubmit(sign)} noValidate>
        <p className="mt-4 mb-0 text-pretty">
          <FormattedMessage id="insuranceTransfer.form.intro" />
        </p>
        <PolicyNumberField insurer={insurer} />
        <EndDateField endDate={endDate} onChange={chooseEndDate} />
        <div className="row">
          <div className="col-md-8">
            <YourDetails insurer={insurer} onFile={onFile} />
            {insurer === 'ARTEA' && <ArteaQuestionnaire />}
          </div>
        </div>
        {asksUsPersonDeclaration(insurer) && <NotUsPersonConfirmation />}

        <div className="mt-5 d-flex flex-column-reverse flex-sm-row justify-content-end align-items-sm-center gap-3">
          <button
            type="button"
            className="btn btn-link"
            disabled={working}
            onClick={methods.handleSubmit(preview)}
          >
            <FormattedMessage id="insuranceTransfer.form.preview" />
          </button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={working}>
            <FormattedMessage id="insuranceTransfer.form.sign" />
          </button>
        </div>
      </form>
    </FormProvider>
  );
};

export const InsurerForm = (props: Props) => {
  const { data: identity, isError } = useKycIdentity();

  if (!identity && !isError) {
    return <Shimmer height={400} />;
  }

  return <FilledInInsurerForm {...props} identity={identity} />;
};
