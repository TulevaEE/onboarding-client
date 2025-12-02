import { FC } from 'react';
import { Control, Controller } from 'react-hook-form';
import { FormattedMessage } from 'react-intl';
import { OnboardingFormData } from '../types';

type ContactDetailsStepProps = {
  control: Control<OnboardingFormData>;
};
export const ContactDetailsStep: FC<ContactDetailsStepProps> = ({ control }) => (
  <section className="d-flex flex-column gap-4" key="contacts">
    <div className="section-header d-flex flex-column gap-1">
      <h2 className="m-0">
        <FormattedMessage id="flows.savingsFundOnboarding.contactDetailsStep.title" />
      </h2>
    </div>
    <div className="section-content d-flex flex-column gap-4">
      <div>
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <>
              <label htmlFor={field.name} className="form-label">
                <FormattedMessage id="flows.savingsFundOnboarding.contactDetailsStep.email.label" />
              </label>
              <input
                {...field}
                type="email"
                className="form-control form-control-lg"
                id={field.name}
                autoComplete="email"
              />
            </>
          )}
        />
      </div>
      <div>
        <Controller
          control={control}
          name="phoneNumber"
          render={({ field }) => (
            <>
              <label htmlFor={field.name} className="form-label">
                <FormattedMessage id="flows.savingsFundOnboarding.contactDetailsStep.phone.label" />
                <span className="text-secondary fw-normal">
                  {' '}
                  <FormattedMessage id="flows.savingsFundOnboarding.contactDetailsStep.phone.optional" />
                </span>
              </label>
              <input
                {...field}
                type="tel"
                className="form-control form-control-lg"
                id={field.name}
                autoComplete="tel"
              />
            </>
          )}
        />
      </div>
    </div>
  </section>
);
