import { FC } from 'react';
import { Control, Controller } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { OnboardingFormData } from '../../types';

type AddressFormProps = {
  control: Control<OnboardingFormData>;
};
export const AddressForm: FC<AddressFormProps> = ({ control }) => {
  const intl = useIntl();
  return (
    <>
      <div className="row gx-3 row-gap-4">
        <div className="col-sm-8">
          <Controller
            control={control}
            name="address.city"
            rules={{
              required: {
                value: true,
                message: intl.formatMessage({
                  id: 'flows.savingsFundOnboarding.residencyStep.city.required',
                }),
              },
            }}
            render={({ field, fieldState: { error } }) => (
              <>
                <label htmlFor={field.name} className="form-label">
                  <FormattedMessage id="flows.savingsFundOnboarding.residencyStep.city.label" />
                </label>
                <input
                  {...field}
                  id={field.name}
                  type="text"
                  className="form-control form-control-lg"
                  autoComplete="address-level2"
                />
                {error && error.message ? (
                  <p className="m-0 text-danger fs-base" role="alert">
                    {error.message}
                  </p>
                ) : null}
              </>
            )}
          />
        </div>
        <div className="col-sm-4">
          <Controller
            control={control}
            name="address.postalCode"
            rules={{
              required: {
                value: true,
                message: intl.formatMessage({
                  id: 'flows.savingsFundOnboarding.residencyStep.postalCode.required',
                }),
              },
            }}
            render={({ field, fieldState: { error } }) => (
              <>
                <label htmlFor={field.name} className="form-label">
                  <FormattedMessage id="flows.savingsFundOnboarding.residencyStep.postalCode.label" />
                </label>
                <input
                  {...field}
                  type="text"
                  className="form-control form-control-lg"
                  id={field.name}
                  autoComplete="postal-code"
                />
                {error && error.message ? (
                  <p className="m-0 text-danger fs-base" role="alert">
                    {error.message}
                  </p>
                ) : null}
              </>
            )}
          />
        </div>
      </div>
      <div>
        <Controller
          control={control}
          name="address.street"
          rules={{
            required: {
              value: true,
              message: intl.formatMessage({
                id: 'flows.savingsFundOnboarding.residencyStep.street.required',
              }),
            },
          }}
          render={({ field, fieldState: { error } }) => (
            <>
              <label htmlFor={field.name} className="form-label">
                <FormattedMessage id="flows.savingsFundOnboarding.residencyStep.street.label" />
              </label>
              <input
                {...field}
                type="text"
                className="form-control form-control-lg"
                id={field.name}
                autoComplete="address-line1"
              />
              {error && error.message ? (
                <p className="m-0 text-danger fs-base" role="alert">
                  {error.message}
                </p>
              ) : null}
            </>
          )}
        />
      </div>
    </>
  );
};
