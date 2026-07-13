import { FC } from 'react';
import { Control, Controller } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { IdentityFormFields } from '../types';
import { AccountHolder } from '../../accountHolder';

type ContactDetailsStepProps = {
  control: Control<IdentityFormFields>;
  accountHolder?: AccountHolder;
};
export const ContactDetailsStep: FC<ContactDetailsStepProps> = ({
  control,
  accountHolder = 'self',
}) => {
  const intl = useIntl();
  const titleId =
    accountHolder === 'child'
      ? ('flows.savingsFundChildOnboarding.contactDetailsStep.title' as const)
      : ('flows.savingsFundOnboarding.contactDetailsStep.title' as const);
  const descriptionId =
    accountHolder === 'child'
      ? ('flows.savingsFundChildOnboarding.contactDetailsStep.description' as const)
      : undefined;

  return (
    <section className="d-flex flex-column gap-4" key="contacts">
      <div className="d-flex flex-column gap-1">
        <h2 className="m-0">
          <FormattedMessage id={titleId} />
        </h2>
        {descriptionId ? (
          <p className="m-0">
            <FormattedMessage id={descriptionId} />
          </p>
        ) : null}
      </div>
      <div className="section-content d-flex flex-column gap-4">
        <div>
          <Controller
            control={control}
            name="email"
            rules={{
              required: {
                value: true,
                message: intl.formatMessage({
                  id: 'flows.savingsFundOnboarding.contactDetailsStep.email.required',
                }),
              },
            }}
            render={({ field, fieldState: { error } }) => (
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
                {error && error.message ? (
                  <p className="m-0 text-danger fs-base" role="alert">
                    {error.message}
                  </p>
                ) : null}
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
};
