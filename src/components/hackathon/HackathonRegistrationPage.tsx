import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { useHackathonRegistration, useMe, useSaveHackathonRegistration } from '../common/apiHooks';
import {
  HackathonChallenge,
  HackathonParticipation,
  HackathonRole,
  HackathonSkill,
} from '../common/apiModels/hackathon';
import Checkbox from '../common/checkbox/Checkbox';
import Radio from '../common/radio/Radio';
import { Loader } from '../common';
import { usePageTitle } from '../common/usePageTitle';
import { TranslationKey } from '../translations';

type HackathonFormData = {
  email: string;
  phoneNumber: string;
  role: HackathonRole;
  skills: HackathonSkill[];
  challenges: HackathonChallenge[];
  participation: HackathonParticipation | null;
  idea: string;
  linkedinUrl: string;
};

const ROLES: { value: HackathonRole; labelId: TranslationKey }[] = [
  { value: 'PARTICIPANT', labelId: 'hackathon.role.participant' },
  { value: 'MENTOR', labelId: 'hackathon.role.mentor' },
];

const PARTICIPATIONS: { value: HackathonParticipation; labelId: TranslationKey }[] = [
  { value: 'WITH_TEAM', labelId: 'hackathon.participation.withTeam' },
  { value: 'WITH_IDEA', labelId: 'hackathon.participation.withIdea' },
  { value: 'LOOKING_FOR_TEAM', labelId: 'hackathon.participation.lookingForTeam' },
];

const SKILLS: { value: HackathonSkill; labelId: TranslationKey }[] = [
  { value: 'SOFTWARE_DEVELOPMENT', labelId: 'hackathon.skill.softwareDevelopment' },
  { value: 'DESIGN', labelId: 'hackathon.skill.design' },
  { value: 'DATA_AND_AI', labelId: 'hackathon.skill.dataAndAi' },
  { value: 'LAW_AND_REGULATION', labelId: 'hackathon.skill.lawAndRegulation' },
  { value: 'BUSINESS_AND_PRODUCT', labelId: 'hackathon.skill.businessAndProduct' },
  { value: 'MARKETING_AND_COMMUNICATION', labelId: 'hackathon.skill.marketingAndCommunication' },
  { value: 'FINANCE_AND_INSURANCE', labelId: 'hackathon.skill.financeAndInsurance' },
];

const CHALLENGES: { value: HackathonChallenge; labelId: TranslationKey }[] = [
  { value: 'FAIR_LENDING', labelId: 'hackathon.challenge.fairLending' },
  { value: 'INSURANCE', labelId: 'hackathon.challenge.insurance' },
  { value: 'COLLECTIVE_BUYING_POWER', labelId: 'hackathon.challenge.collectiveBuyingPower' },
  { value: 'WEALTH_AND_INHERITANCE', labelId: 'hackathon.challenge.wealthAndInheritance' },
];

const toggle = <T,>(values: T[], value: T, checked: boolean): T[] =>
  checked ? [...values, value] : values.filter((item) => item !== value);

const trimmedOrNull = (value: string): string | null => value.trim() || null;

export const HackathonRegistrationPage = () => {
  usePageTitle('pageTitle.hackathon');

  const intl = useIntl();
  const { data: user } = useMe();
  const isMember = Boolean(user?.memberNumber);
  const { data: registration, isLoading, isError } = useHackathonRegistration(isMember);
  const {
    mutateAsync: saveRegistration,
    isLoading: isSaving,
    isError: isSaveError,
    isSuccess: isSaved,
  } = useSaveHackathonRegistration();

  const { control, handleSubmit, reset } = useForm<HackathonFormData>({
    mode: 'onChange',
    defaultValues: {
      email: '',
      phoneNumber: '',
      role: 'PARTICIPANT',
      skills: [],
      challenges: [],
      participation: null,
      idea: '',
      linkedinUrl: '',
    },
  });

  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (registration && !prefilled) {
      setPrefilled(true);
      reset({
        email: registration.email ?? '',
        phoneNumber: registration.phoneNumber ?? '',
        role: registration.role ?? 'PARTICIPANT',
        skills: registration.skills,
        challenges: registration.challenges,
        participation: registration.participation,
        idea: registration.idea ?? '',
        linkedinUrl: registration.linkedinUrl ?? '',
      });
    }
  }, [registration, prefilled, reset]);

  const submit = handleSubmit((data) =>
    saveRegistration({
      email: data.email.trim(),
      phoneNumber: trimmedOrNull(data.phoneNumber),
      role: data.role,
      skills: data.skills,
      challenges: data.challenges,
      participation: data.participation as HackathonParticipation,
      idea: trimmedOrNull(data.idea),
      linkedinUrl: trimmedOrNull(data.linkedinUrl),
    }).catch(() => null),
  );

  if (user && !isMember) {
    return (
      <div className="col-12 col-md-11 col-lg-8 mx-auto py-4">
        <HackathonHeading />
        <div className="card p-4 mt-4">
          <h2 className="mt-0 mb-2 fs-3">
            <FormattedMessage id="hackathon.membersOnly.title" />
          </h2>
          <p className="m-0">
            <FormattedMessage id="hackathon.membersOnly.description" />
          </p>
          <div className="mt-4">
            <a className="btn btn-primary" href="https://tuleva.ee/tulundusyhistu/">
              <FormattedMessage id="hackathon.membersOnly.action" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <Loader className="align-middle" />;
  }

  if (isError || !registration) {
    return (
      <div className="col-12 col-md-11 col-lg-8 mx-auto py-4">
        <HackathonHeading />
        <div className="alert alert-danger mt-4" role="alert">
          <FormattedMessage id="hackathon.loadFailed" />
        </div>
      </div>
    );
  }

  const deadline = (
    <FormattedDate
      value={new Date(registration.deadline)}
      day="numeric"
      month="long"
      timeZone="Europe/Tallinn"
    />
  );

  if (!registration.open) {
    return (
      <div className="col-12 col-md-11 col-lg-8 mx-auto py-4">
        <HackathonHeading />
        <div className="card p-4 mt-4">
          <h2 className="mt-0 mb-2 fs-3">
            <FormattedMessage id="hackathon.closed.title" />
          </h2>
          <p className="m-0">
            <FormattedMessage
              id={
                registration.registered
                  ? 'hackathon.closed.registered'
                  : 'hackathon.closed.description'
              }
              values={{ deadline }}
            />
          </p>
          <div className="mt-4">
            <Link className="btn btn-outline-primary" to="/">
              <FormattedMessage id="hackathon.backToAccount" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="col-12 col-md-11 col-lg-8 mx-auto py-4">
      <HackathonHeading />

      {registration.registered && (
        <div className="alert alert-success mt-4" role="status">
          <FormattedMessage id="hackathon.alreadyRegistered" values={{ deadline }} />
        </div>
      )}

      <form onSubmit={submit} className="d-flex flex-column gap-4 mt-4">
        <section className="d-flex flex-column gap-2">
          <h2 className="m-0 fs-3">
            <FormattedMessage id="hackathon.contact.title" />
          </h2>
          <p className="m-0 text-body-secondary">
            <FormattedMessage id="hackathon.contact.description" />
          </p>
          <div className="row g-3 mt-0">
            <div className="col-12 col-sm-6">
              <label className="form-label" htmlFor="hackathon-email">
                <FormattedMessage id="hackathon.contact.email" />
              </label>
              <Controller
                control={control}
                name="email"
                rules={{
                  required: intl.formatMessage({ id: 'hackathon.contact.email.required' }),
                  pattern: {
                    value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
                    message: intl.formatMessage({ id: 'hackathon.contact.email.invalid' }),
                  },
                }}
                render={({ field, fieldState: { error } }) => (
                  <>
                    <input
                      {...field}
                      id="hackathon-email"
                      type="email"
                      className="form-control form-control-lg"
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? 'hackathon-email-error' : undefined}
                    />
                    {error?.message && (
                      <p
                        className="mt-1 mb-0 text-danger fs-base"
                        role="alert"
                        id="hackathon-email-error"
                      >
                        {error.message}
                      </p>
                    )}
                  </>
                )}
              />
            </div>
            <div className="col-12 col-sm-6">
              <label className="form-label" htmlFor="hackathon-phone">
                <FormattedMessage id="hackathon.contact.phoneNumber" />
              </label>
              <Controller
                control={control}
                name="phoneNumber"
                render={({ field }) => (
                  <input
                    {...field}
                    id="hackathon-phone"
                    type="tel"
                    className="form-control form-control-lg"
                  />
                )}
              />
            </div>
          </div>
        </section>

        <section className="d-flex flex-column gap-2">
          <h2 className="m-0 fs-3" id="hackathon-role-title">
            <FormattedMessage id="hackathon.role.title" />
          </h2>
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <div
                className="d-flex flex-column gap-2"
                role="radiogroup"
                aria-labelledby="hackathon-role-title"
              >
                {ROLES.map(({ value, labelId }) => (
                  <Radio
                    key={value}
                    name="hackathon-role"
                    id={`hackathon-role-${value}`}
                    selected={field.value === value}
                    onSelect={() => field.onChange(value)}
                  >
                    <span className="fs-3 lh-sm">
                      <FormattedMessage id={labelId} />
                    </span>
                  </Radio>
                ))}
              </div>
            )}
          />
        </section>

        <section className="d-flex flex-column gap-2">
          <h2 className="m-0 fs-3" id="hackathon-participation-title">
            <FormattedMessage id="hackathon.participation.title" />
          </h2>
          <Controller
            control={control}
            name="participation"
            rules={{
              required: intl.formatMessage({ id: 'hackathon.participation.required' }),
            }}
            render={({ field, fieldState: { error } }) => (
              <div
                className="d-flex flex-column gap-2"
                role="radiogroup"
                aria-labelledby="hackathon-participation-title"
                aria-describedby={error ? 'hackathon-participation-error' : undefined}
              >
                {PARTICIPATIONS.map(({ value, labelId }) => (
                  <Radio
                    key={value}
                    name="hackathon-participation"
                    id={`hackathon-participation-${value}`}
                    selected={field.value === value}
                    onSelect={() => field.onChange(value)}
                  >
                    <span className="fs-3 lh-sm">
                      <FormattedMessage id={labelId} />
                    </span>
                  </Radio>
                ))}
                {error?.message && (
                  <p
                    className="m-0 text-danger fs-base"
                    role="alert"
                    id="hackathon-participation-error"
                  >
                    {error.message}
                  </p>
                )}
              </div>
            )}
          />
        </section>

        <section className="d-flex flex-column gap-2">
          <h2 className="m-0 fs-3" id="hackathon-skills-title">
            <FormattedMessage id="hackathon.skills.title" />
          </h2>
          <p className="m-0 text-body-secondary">
            <FormattedMessage id="hackathon.skills.description" />
          </p>
          <Controller
            control={control}
            name="skills"
            render={({ field }) => (
              <div
                className="d-flex flex-column gap-2"
                role="group"
                aria-labelledby="hackathon-skills-title"
              >
                {SKILLS.map(({ value, labelId }) => (
                  <Checkbox
                    key={value}
                    id={`hackathon-skill-${value}`}
                    checked={field.value.includes(value)}
                    onToggle={(checked) => field.onChange(toggle(field.value, value, checked))}
                  >
                    <span className="fs-3 lh-sm">
                      <FormattedMessage id={labelId} />
                    </span>
                  </Checkbox>
                ))}
              </div>
            )}
          />
        </section>

        <section className="d-flex flex-column gap-2">
          <h2 className="m-0 fs-3" id="hackathon-challenges-title">
            <FormattedMessage id="hackathon.challenges.title" />
          </h2>
          <p className="m-0 text-body-secondary">
            <FormattedMessage id="hackathon.challenges.description" />
          </p>
          <Controller
            control={control}
            name="challenges"
            render={({ field }) => (
              <div
                className="d-flex flex-column gap-2"
                role="group"
                aria-labelledby="hackathon-challenges-title"
              >
                {CHALLENGES.map(({ value, labelId }) => (
                  <Checkbox
                    key={value}
                    id={`hackathon-challenge-${value}`}
                    checked={field.value.includes(value)}
                    onToggle={(checked) => field.onChange(toggle(field.value, value, checked))}
                  >
                    <span className="fs-3 lh-sm">
                      <FormattedMessage id={labelId} />
                    </span>
                  </Checkbox>
                ))}
              </div>
            )}
          />
        </section>

        <section className="d-flex flex-column gap-3">
          <div>
            <label className="form-label" htmlFor="hackathon-idea">
              <FormattedMessage id="hackathon.idea.label" />
            </label>
            <Controller
              control={control}
              name="idea"
              rules={{ maxLength: 500 }}
              render={({ field }) => (
                <input
                  {...field}
                  id="hackathon-idea"
                  type="text"
                  maxLength={500}
                  className="form-control form-control-lg"
                  placeholder={intl.formatMessage({ id: 'hackathon.idea.placeholder' })}
                />
              )}
            />
          </div>
          <div>
            <label className="form-label" htmlFor="hackathon-linkedin">
              <FormattedMessage id="hackathon.linkedin.label" />
            </label>
            <Controller
              control={control}
              name="linkedinUrl"
              rules={{ maxLength: 500 }}
              render={({ field }) => (
                <input
                  {...field}
                  id="hackathon-linkedin"
                  type="text"
                  maxLength={500}
                  className="form-control form-control-lg"
                  placeholder="https://linkedin.com/in/..."
                />
              )}
            />
          </div>
        </section>

        {isSaveError && (
          <div className="alert alert-danger" role="alert">
            <FormattedMessage id="hackathon.saveFailed" />
          </div>
        )}

        {isSaved && !isSaveError && (
          <div className="alert alert-success" role="status">
            <FormattedMessage id="hackathon.saved" />
          </div>
        )}

        <div>
          <button type="submit" className="btn btn-primary btn-lg" disabled={isSaving}>
            {isSaving && <span className="spinner-border spinner-border-sm me-2" aria-hidden />}
            <FormattedMessage
              id={registration.registered ? 'hackathon.submit.update' : 'hackathon.submit.register'}
            />
          </button>
        </div>
      </form>
    </div>
  );
};

const HackathonHeading = () => (
  <>
    <h1 className="m-0">
      <FormattedMessage id="hackathon.title" />
    </h1>
    <p className="mt-2 mb-0 text-body-secondary">
      <FormattedMessage id="hackathon.subtitle" />
    </p>
  </>
);
