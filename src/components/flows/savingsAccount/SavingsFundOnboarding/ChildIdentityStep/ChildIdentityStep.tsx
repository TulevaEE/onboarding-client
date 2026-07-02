import { FC } from 'react';
import { Control, Controller } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { ChildOnboardingFormData } from '../types';

type ChildIdentityStepProps = {
  control: Control<ChildOnboardingFormData>;
};

// The custody check happens server-side (POST /v1/me/children). This only guards
// against obvious typos so an empty or malformed code never reaches the backend.
const ESTONIAN_PERSONAL_CODE = /^\d{11}$/;

export const ChildIdentityStep: FC<ChildIdentityStepProps> = ({ control }) => {
  const intl = useIntl();

  return (
    <section className="d-flex flex-column gap-4" key="child-identity">
      <div className="d-flex flex-column gap-1">
        <h2 className="m-0">
          <FormattedMessage id="flows.savingsFundChildOnboarding.identityStep.title" />
        </h2>
        <p className="m-0">
          <FormattedMessage id="flows.savingsFundChildOnboarding.identityStep.description" />
        </p>
      </div>
      <div className="section-content d-flex flex-column gap-4">
        <Controller
          control={control}
          name="childPersonalCode"
          rules={{
            required: {
              value: true,
              message: intl.formatMessage({
                id: 'flows.savingsFundChildOnboarding.identityStep.required',
              }),
            },
            pattern: {
              value: ESTONIAN_PERSONAL_CODE,
              message: intl.formatMessage({
                id: 'flows.savingsFundChildOnboarding.identityStep.invalid',
              }),
            },
          }}
          render={({ field, fieldState: { error } }) => (
            <div>
              <label htmlFor={field.name} className="form-label">
                <FormattedMessage id="flows.savingsFundChildOnboarding.identityStep.label" />
              </label>
              <input
                {...field}
                id={field.name}
                inputMode="numeric"
                autoComplete="off"
                className="form-control form-control-lg"
                placeholder={intl.formatMessage({
                  id: 'flows.savingsFundChildOnboarding.identityStep.placeholder',
                })}
              />
              {error && error.message ? (
                <p className="m-0 mt-1 text-danger fs-base" role="alert">
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
