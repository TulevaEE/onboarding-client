import { FC } from 'react';
import { Control, Controller } from 'react-hook-form';
import { FormattedMessage } from 'react-intl';
import { OnboardingFormData } from '../../types';

type AddressFormProps = {
  control: Control<OnboardingFormData>;
};
export const AddressForm: FC<AddressFormProps> = ({ control }) => (
  <>
    <div className="row gx-3 row-gap-4">
      <div className="col-sm-8">
        <Controller
          control={control}
          name="address.city"
          render={({ field }) => (
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
            </>
          )}
        />
      </div>
      <div className="col-sm-4">
        <Controller
          control={control}
          name="address.postalCode"
          render={({ field }) => (
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
            </>
          )}
        />
      </div>
    </div>
    <div>
      <Controller
        control={control}
        name="address.street"
        render={({ field }) => (
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
          </>
        )}
      />
    </div>
  </>
);
