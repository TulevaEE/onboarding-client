import { FormattedMessage, useIntl } from 'react-intl';
import { useFormContext, useWatch } from 'react-hook-form';
import {
  ID_DOCUMENT_TYPES,
  INCOME_SOURCES,
  MONTHLY_NET_INCOMES,
  OCCUPATION_STATUSES,
} from '../../common/apiModels/insurance-transfer';
import { isValidIban } from '../../common/iban';
import { PII_CLASS } from '../../tracking/piiMarkup';
import { ChoiceField, CountryField, TextField } from './formFields';
import {
  asksEmployer,
  asksIncomeSourceDetails,
  asksOccupationDescription,
  InsurerFormValues,
} from './insurerFormValues';

const useRequired = () => {
  const { formatMessage } = useIntl();
  const message = formatMessage({ id: 'new.user.flow.signup.error.required.field' });
  return {
    chosen: { required: message },
    answered: { validate: (value: string | undefined) => !!value?.trim() || message },
  };
};

const IdDocumentFields = () => {
  const required = useRequired();
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<InsurerFormValues>();
  const idDocumentErrors = errors.artea?.idDocument;

  return (
    <>
      <div className="row gx-3 row-gap-3">
        <ChoiceField
          className="col-sm-6"
          id="insurer-form-id-document-type"
          label={<FormattedMessage id="insuranceTransfer.form.artea.idDocument.type" />}
          registration={register('artea.idDocument.type', required.chosen)}
          error={idDocumentErrors?.type?.message}
          choices={ID_DOCUMENT_TYPES}
          choiceMessageId={(type) => `insuranceTransfer.form.artea.idDocument.type.${type}`}
        />
        <TextField
          className="col-sm-6"
          id="insurer-form-id-document-number"
          label={<FormattedMessage id="insuranceTransfer.form.artea.idDocument.number" />}
          registration={register('artea.idDocument.number', required.answered)}
          error={idDocumentErrors?.number?.message}
          maxLength={40}
        />
        <TextField
          className="col-sm-6"
          type="date"
          id="insurer-form-id-document-issued-on"
          label={<FormattedMessage id="insuranceTransfer.form.artea.idDocument.issuedOn" />}
          registration={register('artea.idDocument.issuedOn', required.answered)}
          error={idDocumentErrors?.issuedOn?.message}
        />
        <TextField
          className="col-sm-6"
          type="date"
          id="insurer-form-id-document-valid-until"
          label={<FormattedMessage id="insuranceTransfer.form.artea.idDocument.validUntil" />}
          registration={register('artea.idDocument.validUntil', required.answered)}
          error={idDocumentErrors?.validUntil?.message}
        />
      </div>
      <CountryField
        id="insurer-form-id-document-issuing-country"
        label={<FormattedMessage id="insuranceTransfer.form.artea.idDocument.issuingCountry" />}
        control={control}
        name="artea.idDocument.issuingCountry"
      />
    </>
  );
};

const OccupationFields = () => {
  const required = useRequired();
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<InsurerFormValues>();
  const status = useWatch({ control, name: 'artea.occupation.status' });
  const occupationErrors = errors.artea?.occupation;

  return (
    <>
      <ChoiceField
        id="insurer-form-occupation"
        label={<FormattedMessage id="insuranceTransfer.form.artea.occupation" />}
        registration={register('artea.occupation.status', required.chosen)}
        error={occupationErrors?.status?.message}
        choices={OCCUPATION_STATUSES}
        choiceMessageId={(choice) => `insuranceTransfer.form.artea.occupation.${choice}`}
      />
      {asksEmployer(status) && (
        <>
          <TextField
            id="insurer-form-position"
            label={<FormattedMessage id="insuranceTransfer.form.artea.occupation.position" />}
            registration={register('artea.occupation.position', required.answered)}
            error={occupationErrors?.position?.message}
            maxLength={200}
          />
          <TextField
            id="insurer-form-employer"
            label={<FormattedMessage id="insuranceTransfer.form.artea.occupation.employer" />}
            registration={register('artea.occupation.employer', required.answered)}
            error={occupationErrors?.employer?.message}
            maxLength={200}
          />
          <TextField
            id="insurer-form-employer-address"
            label={
              <FormattedMessage id="insuranceTransfer.form.artea.occupation.employerAddress" />
            }
            registration={register('artea.occupation.employerAddress', required.answered)}
            error={occupationErrors?.employerAddress?.message}
            maxLength={200}
          />
        </>
      )}
      {asksOccupationDescription(status) && (
        <TextField
          id="insurer-form-occupation-description"
          label={
            <FormattedMessage
              id={`insuranceTransfer.form.artea.occupation.description.${status}`}
            />
          }
          registration={register('artea.occupation.description', required.answered)}
          error={occupationErrors?.description?.message}
          maxLength={500}
        />
      )}
    </>
  );
};

const IncomeSourceFields = () => {
  const { formatMessage } = useIntl();
  const required = useRequired();
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<InsurerFormValues>();
  const checked = useWatch({ control, name: 'artea.incomeSources' });
  const registration = register('artea.incomeSources', {
    validate: (sources) =>
      sources.length > 0 ||
      formatMessage({ id: 'flows.savingsFundChildOnboarding.fundingSourcesStep.required' }),
  });
  const error = errors.artea?.incomeSources?.message;

  return (
    <fieldset>
      <legend className="form-label">
        <FormattedMessage id="insuranceTransfer.form.artea.incomeSources" />
      </legend>
      {INCOME_SOURCES.map((source) => (
        <div key={source}>
          <div className="form-check">
            <input
              type="checkbox"
              className={`form-check-input ${error ? 'is-invalid' : ''}`}
              id={`insurer-form-income-${source}`}
              value={source}
              {...registration}
            />
            <label className="form-check-label" htmlFor={`insurer-form-income-${source}`}>
              <FormattedMessage id={`insuranceTransfer.form.artea.incomeSources.${source}`} />
            </label>
          </div>
          {checked.includes(source) && asksIncomeSourceDetails(source) && (
            <TextField
              className="ms-4 mt-1 mb-2"
              id={`insurer-form-income-${source}-details`}
              label={
                <FormattedMessage
                  id={`insuranceTransfer.form.artea.incomeSources.${source}.details`}
                />
              }
              registration={register(`artea.incomeSourceDetails.${source}`, required.answered)}
              error={errors.artea?.incomeSourceDetails?.[source]?.message}
              maxLength={300}
            />
          )}
        </div>
      ))}
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </fieldset>
  );
};

export const ArteaQuestionnaire = () => {
  const { formatMessage } = useIntl();
  const required = useRequired();
  const {
    register,
    formState: { errors },
  } = useFormContext<InsurerFormValues>();

  return (
    <fieldset className={`mt-4 d-flex flex-column gap-3 ${PII_CLASS}`}>
      <legend className="h6 mb-0">
        <FormattedMessage id="insuranceTransfer.form.artea.title" />
      </legend>
      <IdDocumentFields />
      <OccupationFields />
      <IncomeSourceFields />
      <ChoiceField
        id="insurer-form-monthly-net-income"
        label={<FormattedMessage id="insuranceTransfer.form.artea.monthlyNetIncome" />}
        registration={register('artea.monthlyNetIncome', required.chosen)}
        error={errors.artea?.monthlyNetIncome?.message}
        choices={MONTHLY_NET_INCOMES}
        choiceMessageId={(income) => `insuranceTransfer.form.artea.monthlyNetIncome.${income}`}
      />
      <TextField
        id="insurer-form-premium-account"
        label={<FormattedMessage id="insuranceTransfer.form.artea.premiumAccountIban" />}
        registration={register('artea.premiumAccountIban', {
          validate: (iban) =>
            isValidIban(iban) || formatMessage({ id: 'capital.transfer.create.error.ibanInvalid' }),
        })}
        error={errors.artea?.premiumAccountIban?.message}
        autoComplete="off"
      />
    </fieldset>
  );
};
