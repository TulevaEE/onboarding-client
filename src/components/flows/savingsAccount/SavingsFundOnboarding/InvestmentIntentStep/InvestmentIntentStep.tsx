import { FC } from 'react';
import { Control, Controller } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { OnboardingFormData } from '../types';
import { Radio } from '../../../../common';

type InvestmentIntentStepProps = {
  control: Control<OnboardingFormData>;
};

const options = [
  {
    id: 'intent-self',
    value: 'SELF',
    labelId: 'flows.savingsFundOnboarding.investmentIntentStep.self',
  },
  {
    id: 'intent-both',
    value: 'BOTH',
    labelId: 'flows.savingsFundOnboarding.investmentIntentStep.both',
  },
  {
    id: 'intent-company',
    value: 'ONLY_VIA_COMPANY',
    labelId: 'flows.savingsFundOnboarding.investmentIntentStep.onlyViaCompany',
  },
] as const;

export const InvestmentIntentStep: FC<InvestmentIntentStepProps> = ({ control }) => {
  const intl = useIntl();
  return (
    <section className="d-flex flex-column gap-4" key="investment-intent">
      <div className="d-flex flex-column gap-1">
        <h2 className="m-0">
          <FormattedMessage id="flows.savingsFundOnboarding.investmentIntentStep.title" />
        </h2>
        <p className="m-0">
          <FormattedMessage id="flows.savingsFundOnboarding.investmentIntentStep.description" />
        </p>
      </div>
      <div className="section-content d-flex flex-column gap-4">
        <Controller
          control={control}
          name="investmentIntent"
          rules={{
            required: {
              value: true,
              message: intl.formatMessage({
                id: 'flows.savingsFundOnboarding.investmentIntentStep.required',
              }),
            },
          }}
          render={({ field, fieldState: { error } }) => (
            <div className="selection-group d-flex flex-column gap-2">
              {options.map(({ id, value, labelId }) => (
                <Radio
                  key={id}
                  name={field.name}
                  id={id}
                  selected={field.value === value}
                  onSelect={() => field.onChange(value)}
                  className="p-3"
                >
                  <label className="form-check-label fs-3 lh-sm me-2" htmlFor={id}>
                    <FormattedMessage id={labelId} />
                  </label>
                </Radio>
              ))}
              <Radio name={field.name} id="intent-child" selected={false} disabled className="p-3">
                <label
                  className="form-check-label fs-3 lh-sm me-2 d-flex align-items-center gap-2"
                  htmlFor="intent-child"
                >
                  <FormattedMessage id="flows.savingsFundOnboarding.investmentIntentStep.child" />
                  <span className="badge rounded-pill text-bg-secondary fw-medium">
                    <FormattedMessage id="flows.savingsFundOnboarding.investmentIntentStep.comingSoon" />
                  </span>
                </label>
              </Radio>
              {error && error.message ? (
                <p className="m-0 text-danger fs-base" role="alert">
                  {error.message}
                </p>
              ) : null}
            </div>
          )}
        />
      </div>
    </section>
  );
};
