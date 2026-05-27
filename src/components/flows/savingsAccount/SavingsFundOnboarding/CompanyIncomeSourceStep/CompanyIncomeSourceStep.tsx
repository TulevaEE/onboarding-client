import { FC } from 'react';
import { Control, Controller } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { InfoTooltip } from '../../../../common/infoTooltip/InfoTooltip';
import { TranslationKey } from '../../../../translations';
import { CompanyOnboardingFormData } from '../types';

const CHECKBOX_OPTIONS: ReadonlyArray<{
  key: keyof CompanyOnboardingFormData['sourceOfCompanyIncome'];
  labelId: TranslationKey;
  tooltipId?: TranslationKey;
}> = [
  {
    key: 'ONLY_ACTIVE_IN_ESTONIA',
    labelId: 'flows.savingsFundOnboarding.companyIncomeSourceStep.onlyActiveInEstonia',
  },
  {
    key: 'NOT_SANCTIONED_NOT_PROFITING_FROM_SANCTIONED_COUNTRIES',
    labelId: 'flows.savingsFundOnboarding.companyIncomeSourceStep.notSanctioned',
  },
  {
    key: 'NOT_IN_CRYPTO',
    labelId: 'flows.savingsFundOnboarding.companyIncomeSourceStep.notInCrypto',
    tooltipId: 'flows.savingsFundOnboarding.companyIncomeSourceStep.notInCrypto.tooltip',
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
            {CHECKBOX_OPTIONS.map(({ key, labelId, tooltipId }) => {
              const isChecked = field.value[key];
              return (
                <label
                  key={key}
                  htmlFor={key}
                  className={`d-flex flex-column border ${
                    isChecked ? 'bg-blue-1 border-primary border-2' : 'bg-gray-1 border-gray-2'
                  } rounded rounded-3 p-3 form-check-label`}
                >
                  <div
                    className={`d-flex gap-3 fs-3 border border-transparent ${
                      isChecked ? 'border-0' : 'border-1'
                    }`}
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
                    <span>
                      <FormattedMessage id={labelId} />
                      {tooltipId && (
                        // Stop the click from toggling the checkbox when opening the tooltip.
                        // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
                        <span
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <InfoTooltip name={key}>
                            <FormattedMessage id={tooltipId} />
                          </InfoTooltip>
                        </span>
                      )}
                    </span>
                  </div>
                </label>
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
