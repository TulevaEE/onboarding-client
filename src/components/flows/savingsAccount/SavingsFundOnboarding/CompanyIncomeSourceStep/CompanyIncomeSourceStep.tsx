import { FC } from 'react';
import { Control, Controller } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { CompanyOnboardingFormData } from '../types';

const CHECKBOX_OPTIONS = [
  {
    key: 'OPERATING_ONLY_IN_ESTONIA' as const,
    labelId: 'flows.savingsFundOnboarding.companyIncomeSourceStep.operatingOnlyInEstonia' as const,
  },
  {
    key: 'NOT_SANCTIONED_AND_NOT_DOING_BUSINESS_WITH_SANCTIONED_COUNTRIES' as const,
    labelId: 'flows.savingsFundOnboarding.companyIncomeSourceStep.notSanctioned' as const,
  },
  {
    key: 'NOT_IN_CRYPTO' as const,
    labelId: 'flows.savingsFundOnboarding.companyIncomeSourceStep.notInCrypto' as const,
  },
];

type CompanyIncomeSourceStepProps = {
  control: Control<CompanyOnboardingFormData>;
};

export const CompanyIncomeSourceStep: FC<CompanyIncomeSourceStepProps> = ({ control }) => {
  const intl = useIntl();

  return (
    <section className="d-flex flex-column gap-4">
      <div className="d-flex flex-column gap-1">
        <h2 className="m-0">
          <FormattedMessage id="flows.savingsFundOnboarding.companyIncomeSourceStep.title" />
        </h2>
        <p className="m-0">
          <FormattedMessage id="flows.savingsFundOnboarding.companyIncomeSourceStep.description" />
        </p>
      </div>
      <Controller
        control={control}
        name="sourceOfCompanyIncome"
        rules={{
          validate: (value) =>
            Object.values(value).every(Boolean) ||
            intl.formatMessage({
              id: 'flows.savingsFundOnboarding.companyIncomeSourceStep.error',
            }),
        }}
        render={({ field, fieldState: { error } }) => (
          <div className="d-flex flex-column gap-2">
            {CHECKBOX_OPTIONS.map(({ key, labelId }) => {
              const isChecked = field.value[key];
              return (
                <div
                  className={`d-flex flex-column border ${
                    isChecked ? 'bg-blue-1 border-primary border-2' : 'bg-gray-1 border-gray-2'
                  } rounded rounded-3 p-3`}
                >
                  <div
                    className={`d-flex gap-3 fs-3 border border-transparent ${
                      isChecked ? 'border-0' : 'border-1'
                    }`}
                    key={key}
                  >
                    <input
                      className={`form-check-input border-2 ${
                        isChecked ? 'border-primary' : 'border-secondary'
                      }`}
                      type="checkbox"
                      id={key}
                      checked={isChecked}
                      onChange={(e) => field.onChange({ ...field.value, [key]: e.target.checked })}
                    />
                    <label className="form-check-label" htmlFor={key}>
                      <FormattedMessage id={labelId} />
                    </label>
                  </div>
                </div>
              );
            })}
            {error && error.message ? (
              <p className="m-0 text-danger fs-base" role="alert">
                {error.message}
              </p>
            ) : null}
          </div>
        )}
      />
    </section>
  );
};
