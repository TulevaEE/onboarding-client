import { Fragment, ReactNode, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { InsuranceTransferFormInsurer } from '../../common/apiModels/insurance-transfer';
import { MultiSelect } from '../../common/MultiSelect/MultiSelect';
import { mapCountriesToGroupedOptions } from '../../common/countries';
import { PII_CLASS } from '../../tracking/piiMarkup';
import { TranslationKey } from '../../translations';
import { CountryField, TextField, useCountryName } from './formFields';
import {
  asksCitizenshipTaxResidencyAndExposure,
  DetailsOnFile,
  InsurerFormValues,
  taxResidencyOf,
} from './insurerFormValues';

const DETAILS_HEADING_ID = 'insurer-form-details-heading';

type Detail = 'address' | 'citizenship' | 'taxResidency' | 'countryOfBirth' | 'pep';

const notBlank = (message: string) => (value: string) => value.trim() !== '' || message;

const AddressFields = () => {
  const { formatMessage } = useIntl();
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<InsurerFormValues>();
  const requiredMessage = (id: TranslationKey) => ({ validate: notBlank(formatMessage({ id })) });

  return (
    <fieldset className="mt-3 d-flex flex-column gap-3">
      <legend className="form-label fs-6 mb-0">
        <FormattedMessage id="insuranceTransfer.form.details.address" />
      </legend>
      <CountryField
        id="insurer-form-address-country"
        label={<FormattedMessage id="flows.savingsFundOnboarding.residencyStep.country.label" />}
        control={control}
        name="address.countryCode"
      />
      <TextField
        id="insurer-form-address-street"
        label={<FormattedMessage id="flows.savingsFundOnboarding.residencyStep.street.label" />}
        registration={register(
          'address.street',
          requiredMessage('flows.savingsFundOnboarding.residencyStep.street.required'),
        )}
        error={errors.address?.street?.message}
        autoComplete="address-line1"
        maxLength={200}
      />
      <div className="row gx-3 row-gap-3">
        <TextField
          className="col-sm-8"
          id="insurer-form-address-city"
          label={<FormattedMessage id="flows.savingsFundOnboarding.residencyStep.city.label" />}
          registration={register(
            'address.city',
            requiredMessage('flows.savingsFundOnboarding.residencyStep.city.required'),
          )}
          error={errors.address?.city?.message}
          autoComplete="address-level2"
          maxLength={100}
        />
        <TextField
          className="col-sm-4"
          id="insurer-form-address-postal-code"
          label={
            <FormattedMessage id="flows.savingsFundOnboarding.residencyStep.postalCode.label" />
          }
          registration={register(
            'address.postalCode',
            requiredMessage('flows.savingsFundOnboarding.residencyStep.postalCode.required'),
          )}
          error={errors.address?.postalCode?.message}
          autoComplete="postal-code"
          maxLength={20}
        />
      </div>
    </fieldset>
  );
};

const CitizenshipField = () => {
  const intl = useIntl();
  const { control } = useFormContext<InsurerFormValues>();
  const options = useMemo(() => mapCountriesToGroupedOptions(intl), [intl]);
  const label = intl.formatMessage({ id: 'insuranceTransfer.form.details.citizenship' });

  return (
    <Controller
      control={control}
      name="citizenship"
      rules={{
        validate: (value) =>
          value.length > 0 ||
          intl.formatMessage({ id: 'flows.savingsFundOnboarding.citizenshipStep.input.required' }),
      }}
      render={({ field, fieldState: { error } }) => (
        <div className="mt-3">
          <div className="form-label" aria-hidden>
            {label}
          </div>
          <MultiSelect
            className="form-select"
            options={options}
            selected={field.value}
            placeholder={intl.formatMessage({
              id: 'flows.savingsFundOnboarding.citizenshipStep.input.placeholder',
            })}
            deleteButtonTitle={intl.formatMessage({
              id: 'flows.savingsFundOnboarding.citizenshipStep.input.deleteButtonTitle',
            })}
            onChange={field.onChange}
            onBlur={field.onBlur}
            ariaLabel={label}
            maxItems={5}
          />
          {error?.message && <div className="invalid-feedback d-block">{error.message}</div>}
        </div>
      )}
    />
  );
};

const PepField = () => {
  const { formatMessage } = useIntl();
  const {
    register,
    formState: { errors },
  } = useFormContext<InsurerFormValues>();
  const registration = register('pepSelfDeclaration', {
    required: formatMessage({ id: 'flows.savingsFundOnboarding.pepStep.required' }),
  });
  const error = errors.pepSelfDeclaration?.message;

  return (
    <fieldset className="mt-3">
      <legend className="form-label fs-6">
        <FormattedMessage id="flows.savingsFundOnboarding.pepStep.title" />
      </legend>
      {(
        [
          ['IS_NOT_PEP', 'flows.savingsFundOnboarding.pepStep.no'],
          ['IS_PEP', 'flows.savingsFundOnboarding.pepStep.yes'],
        ] as const
      ).map(([value, labelId]) => (
        <div className="form-check" key={value}>
          <input
            type="radio"
            className={`form-check-input ${error ? 'is-invalid' : ''}`}
            id={`insurer-form-pep-${value}`}
            value={value}
            {...registration}
          />
          <label className="form-check-label" htmlFor={`insurer-form-pep-${value}`}>
            <FormattedMessage id={labelId} />
          </label>
        </div>
      ))}
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </fieldset>
  );
};

const useSummary = (): Record<Detail, { termId: TranslationKey; value: ReactNode }> => {
  const { control } = useFormContext<InsurerFormValues>();
  const countryName = useCountryName();
  const values = useWatch({ control }) as InsurerFormValues;
  const { street, city, postalCode, countryCode } = values.address;

  return {
    address: {
      termId: 'insuranceTransfer.form.details.address',
      value: `${street}, ${city}, ${postalCode}, ${countryName(countryCode)}`,
    },
    citizenship: {
      termId: 'insuranceTransfer.form.details.citizenship',
      value: values.citizenship.map(countryName).join(', '),
    },
    taxResidency: {
      termId: 'insuranceTransfer.form.details.taxResidency',
      value: countryName(taxResidencyOf(values)),
    },
    countryOfBirth: {
      termId: 'insuranceTransfer.form.details.countryOfBirth',
      value: countryName(values.countryOfBirth),
    },
    pep: {
      termId: 'insuranceTransfer.form.details.pep',
      value: values.pepSelfDeclaration && (
        <FormattedMessage id={`insuranceTransfer.form.details.pep.${values.pepSelfDeclaration}`} />
      ),
    },
  };
};

const shownDetails = (
  insurer: InsuranceTransferFormInsurer,
  onFile: DetailsOnFile,
  editing: boolean,
) => {
  const asked: Detail[] = asksCitizenshipTaxResidencyAndExposure(insurer)
    ? ['address', 'citizenship', 'taxResidency', 'countryOfBirth', 'pep']
    : ['address'];
  const isKnown = (detail: Detail) =>
    detail === 'taxResidency' || detail === 'countryOfBirth' || onFile[detail];
  const summarized = editing ? [] : asked.filter(isKnown);
  return {
    summarized,
    inputs: asked.filter((detail) => !summarized.includes(detail)),
  };
};

export const YourDetails = ({
  insurer,
  onFile,
}: {
  insurer: InsuranceTransferFormInsurer;
  onFile: DetailsOnFile;
}) => {
  const [editing, setEditing] = useState(false);
  const { control } = useFormContext<InsurerFormValues>();
  const addressCountry = useWatch({ control, name: 'address.countryCode' });
  const summary = useSummary();
  const { summarized, inputs } = shownDetails(insurer, onFile, editing);

  return (
    <section className={`mt-4 ${PII_CLASS}`} aria-labelledby={DETAILS_HEADING_ID}>
      <h3 id={DETAILS_HEADING_ID} className="h6 mb-2">
        <FormattedMessage id="insuranceTransfer.form.details.title" />
      </h3>
      {summarized.length > 0 && (
        <>
          <dl className="row mb-1">
            {summarized.map((detail) => (
              <Fragment key={detail}>
                <dt className="col-sm-5 fw-normal text-body-secondary">
                  <FormattedMessage id={summary[detail].termId} />
                </dt>
                <dd className="col-sm-7 mb-1">{summary[detail].value}</dd>
              </Fragment>
            ))}
          </dl>
          <button type="button" className="btn btn-link p-0" onClick={() => setEditing(true)}>
            <FormattedMessage id="insuranceTransfer.form.details.change" />
          </button>
        </>
      )}
      {inputs.includes('address') && <AddressFields />}
      {inputs.includes('citizenship') && <CitizenshipField />}
      {inputs.includes('taxResidency') && (
        <CountryField
          className="mt-3"
          id="insurer-form-tax-residency"
          label={<FormattedMessage id="insuranceTransfer.form.details.taxResidency" />}
          control={control}
          name="taxResidencyIfNotAddressCountry"
          shownWhenUnset={addressCountry}
        />
      )}
      {inputs.includes('countryOfBirth') && (
        <CountryField
          className="mt-3"
          id="insurer-form-country-of-birth"
          label={<FormattedMessage id="insuranceTransfer.form.details.countryOfBirth" />}
          control={control}
          name="countryOfBirth"
        />
      )}
      {inputs.includes('pep') && <PepField />}
    </section>
  );
};
