import { FC, useState } from 'react';
import { Control, Controller, useWatch } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { useEligibleChildren, usePendingOnboardings } from '../../../../common/apiHooks';
import { ChildOnboardingFormData } from '../types';
import { isValidEstonianPersonalCode } from './personalCode';

type ChildIdentityStepProps = {
  control: Control<ChildOnboardingFormData>;
};

export const ChildIdentityStep: FC<ChildIdentityStepProps> = ({ control }) => {
  const intl = useIntl();
  const { data: eligibleChildren = [], isLoading } = useEligibleChildren();
  const { data: pendingOnboardings = [] } = usePendingOnboardings();
  // Children the other guardian already onboarded stay selectable for this user:
  // joining them (completing their own custody-verified onboarding) is exactly
  // what a pending onboarding entry invites them to do.
  const joinableChildCodes = new Set(
    pendingOnboardings.filter(({ type }) => type === 'PERSON').map(({ code }) => code),
  );
  const [manualEntry, setManualEntry] = useState(false);
  const childPersonalCode = useWatch({ control, name: 'childPersonalCode' });
  // A code typed while the lookup was in flight, or carried over from an earlier
  // manual entry, keeps the free-text input — the dropdown must never hide or
  // replace a value that isn't one of its options.
  const showDropdown =
    !manualEntry &&
    eligibleChildren.length > 0 &&
    (!childPersonalCode ||
      eligibleChildren.some(({ personalCode }) => personalCode === childPersonalCode));

  return (
    <section className="d-flex flex-column gap-4" key="child-identity">
      <div className="d-flex flex-column gap-1">
        <h2 className="m-0">
          <FormattedMessage id="flows.savingsFundChildOnboarding.identityStep.title" />
        </h2>
        <p className="m-0">
          <FormattedMessage
            id={
              showDropdown
                ? 'flows.savingsFundChildOnboarding.identityStep.selectDescription'
                : 'flows.savingsFundChildOnboarding.identityStep.description'
            }
          />
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
            validate: (value) =>
              isValidEstonianPersonalCode(value) ||
              intl.formatMessage({
                id: 'flows.savingsFundChildOnboarding.identityStep.invalid',
              }),
          }}
          render={({ field, fieldState: { error } }) => (
            <div className="d-flex flex-column gap-2">
              <div>
                <label htmlFor={field.name} className="form-label">
                  <FormattedMessage id="flows.savingsFundChildOnboarding.identityStep.label" />
                </label>
                {showDropdown ? (
                  <select {...field} id={field.name} className="form-select form-select-lg">
                    <option value="">
                      {intl.formatMessage({
                        id: 'flows.savingsFundChildOnboarding.identityStep.selectPlaceholder',
                      })}
                    </option>
                    {eligibleChildren.map(
                      ({ personalCode, firstName, lastName, hasBeenOnboarded }) => {
                        const name = [firstName, lastName].filter(Boolean).join(' ');
                        const label = name ? `${name} (${personalCode})` : personalCode;
                        const alreadyOpened =
                          Boolean(hasBeenOnboarded) && !joinableChildCodes.has(personalCode);
                        return (
                          <option key={personalCode} value={personalCode} disabled={alreadyOpened}>
                            {alreadyOpened
                              ? `${label} · ${intl.formatMessage({
                                  id: 'flows.savingsFundChildOnboarding.identityStep.accountOpened',
                                })}`
                              : label}
                          </option>
                        );
                      },
                    )}
                  </select>
                ) : (
                  <input
                    {...field}
                    id={field.name}
                    // Disabled until the children lookup settles: if the control could be
                    // focused now, its swap to a select would silently steal focus. Choosing
                    // manual entry pins the input, so it is safe to enable mid-lookup.
                    disabled={isLoading && !manualEntry}
                    inputMode="numeric"
                    autoComplete="off"
                    className="form-control form-control-lg"
                    placeholder={intl.formatMessage({
                      id: 'flows.savingsFundChildOnboarding.identityStep.placeholder',
                    })}
                  />
                )}
                {error && error.message ? (
                  <p className="m-0 mt-1 text-danger fs-base" role="alert">
                    {error.message}
                  </p>
                ) : null}
              </div>
              {showDropdown || (isLoading && !manualEntry) ? (
                <button
                  type="button"
                  className="btn btn-link p-0 align-self-start"
                  onClick={() => setManualEntry(true)}
                >
                  <FormattedMessage id="flows.savingsFundChildOnboarding.identityStep.enterManually" />
                </button>
              ) : null}
            </div>
          )}
        />
      </div>
    </section>
  );
};
