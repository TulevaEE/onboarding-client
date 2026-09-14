import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { useHackathonRegistration, useMe, useSaveHackathonRegistration } from '../common/apiHooks';
import {
  HackathonChallenge,
  HackathonSkill,
  HackathonTshirtColor,
  HackathonTshirtSize,
} from '../common/apiModels/hackathon';
import Checkbox from '../common/checkbox/Checkbox';
import { Loader } from '../common';
import { usePageTitle } from '../common/usePageTitle';
import {
  CHALLENGES,
  FieldError,
  HackathonHeading,
  HackathonMembersOnly,
  OtherSkillsField,
  SkillCheckboxes,
  TermsField,
  toggle,
  trimmedOrNull,
  TshirtFields,
} from './HackathonFormFields';

type HackathonFormData = {
  email: string;
  phoneNumber: string;
  skills: HackathonSkill[];
  otherSkills: string;
  challenges: HackathonChallenge[];
  linkedinUrl: string;
  tshirtColor: HackathonTshirtColor | null;
  tshirtSize: HackathonTshirtSize | '';
  termsAccepted: boolean;
};

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

  const { control, handleSubmit, reset, trigger, formState } = useForm<HackathonFormData>({
    mode: 'onChange',
    defaultValues: {
      email: '',
      phoneNumber: '',
      skills: [],
      otherSkills: '',
      challenges: [],
      linkedinUrl: '',
      tshirtColor: null,
      tshirtSize: '',
      termsAccepted: false,
    },
  });

  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (registration && !prefilled) {
      setPrefilled(true);
      reset({
        email: registration.email ?? '',
        phoneNumber: registration.phoneNumber ?? '',
        skills: registration.skills,
        otherSkills: registration.otherSkills ?? '',
        challenges: registration.challenges,
        linkedinUrl: registration.linkedinUrl ?? '',
        tshirtColor: registration.tshirtColor,
        tshirtSize: registration.tshirtSize ?? '',
        termsAccepted: registration.termsAccepted,
      });
    }
  }, [registration, prefilled, reset]);

  const submit = handleSubmit((data) =>
    saveRegistration({
      email: data.email.trim(),
      phoneNumber: trimmedOrNull(data.phoneNumber),
      role: registration?.role ?? 'PARTICIPANT',
      skills: data.skills,
      otherSkills: trimmedOrNull(data.otherSkills),
      challenges: data.challenges,
      participation: registration?.participation ?? 'LOOKING_FOR_TEAM',
      idea: registration?.idea ?? null,
      linkedinUrl: trimmedOrNull(data.linkedinUrl),
      tshirtColor: data.tshirtColor as HackathonTshirtColor,
      tshirtSize: data.tshirtColor === 'NONE' ? null : data.tshirtSize || null,
      termsAccepted: data.termsAccepted,
    }).catch(() => null),
  );

  if (user && !isMember) {
    return <HackathonMembersOnly titleId="hackathon.title" />;
  }

  if (isLoading) {
    return <Loader className="align-middle" />;
  }

  if (isError || !registration) {
    return (
      <div className="col-12 col-md-11 col-lg-8 mx-auto py-4">
        <HackathonHeading titleId="hackathon.title" />
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
        <HackathonHeading titleId="hackathon.title" />
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
      <HackathonHeading titleId="hackathon.title" />

      {registration.registered && (
        <div className="alert alert-success mt-4" role="status">
          <FormattedMessage
            id={
              registration.participation === 'WITH_IDEA'
                ? 'hackathon.alreadyRegisteredWithIdea'
                : 'hackathon.alreadyRegistered'
            }
            values={{ deadline }}
          />
        </div>
      )}

      <div className="card p-4 mt-4 d-flex flex-column flex-sm-row gap-3 align-items-sm-center justify-content-between">
        <div>
          <h2 className="m-0 fs-3">
            <FormattedMessage id="hackathon.ideaInvite.title" />
          </h2>
          <p className="mt-1 mb-0 text-body-secondary">
            <FormattedMessage id="hackathon.ideaInvite.description" />
          </p>
        </div>
        <div className="d-flex flex-column align-items-sm-center gap-1">
          <Link className="btn btn-primary text-nowrap" to="/hackathon/idea">
            <FormattedMessage id="hackathon.ideaInvite.action" />
          </Link>
          <small className="text-body-secondary">
            <FormattedMessage id="hackathon.ideaInvite.deadline" />
          </small>
        </div>
      </div>

      <form onSubmit={submit} className="d-flex flex-column gap-4 mt-4">
        <p className="m-0 text-body-secondary">
          <FormattedMessage id="hackathon.required.hint" />
        </p>
        <section className="d-flex flex-column gap-2">
          <h2 className="m-0 fs-3">
            <FormattedMessage id="hackathon.contact.title" />
          </h2>
          <p className="m-0 text-body-secondary">
            <FormattedMessage id="hackathon.contact.description" />
          </p>
          <div className="row g-3 mt-0">
            <div className="col-12 col-sm-6">
              <label className="form-label hackathon-required" htmlFor="hackathon-email">
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
                      aria-required
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? 'hackathon-email-error' : undefined}
                    />
                    <div className="mt-1">
                      <FieldError id="hackathon-email-error" message={error?.message} />
                    </div>
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

        <div className="alert alert-info m-0">
          <FormattedMessage id="hackathon.skills.intro" />
        </div>

        <section className="d-flex flex-column gap-2">
          <h2 className="m-0 fs-3 hackathon-required" id="hackathon-skills-title">
            <FormattedMessage id="hackathon.skills.title" />
          </h2>
          <p className="m-0 text-body-secondary">
            <FormattedMessage id="hackathon.skills.description" />
          </p>
          <Controller
            control={control}
            name="skills"
            rules={{
              validate: (skills, values) =>
                skills.length > 0 ||
                values.otherSkills.trim() !== '' ||
                intl.formatMessage({ id: 'hackathon.skills.required' }),
            }}
            render={({ field }) => (
              <SkillCheckboxes
                idPrefix="hackathon-skill"
                labelledBy="hackathon-skills-title"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            control={control}
            name="otherSkills"
            render={({ field }) => (
              <OtherSkillsField
                idPrefix="hackathon-skill"
                value={field.value}
                onChange={(otherSkills) => {
                  field.onChange(otherSkills);
                  if (formState.isSubmitted) {
                    trigger('skills');
                  }
                }}
              />
            )}
          />
          <FieldError id="hackathon-skills-error" message={formState.errors.skills?.message} />
        </section>

        <section className="d-flex flex-column gap-2">
          <h2 className="m-0 fs-3 hackathon-required" id="hackathon-challenges-title">
            <FormattedMessage id="hackathon.challenges.title" />
          </h2>
          <p className="m-0 text-body-secondary">
            <FormattedMessage id="hackathon.challenges.description" />
          </p>
          <Controller
            control={control}
            name="challenges"
            rules={{
              validate: (challenges) =>
                challenges.length > 0 ||
                intl.formatMessage({ id: 'hackathon.challenges.required' }),
            }}
            render={({ field, fieldState: { error } }) => (
              <div
                className="d-flex flex-column gap-2"
                role="group"
                aria-labelledby="hackathon-challenges-title"
                aria-describedby={error ? 'hackathon-challenges-error' : undefined}
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
                <FieldError id="hackathon-challenges-error" message={error?.message} />
              </div>
            )}
          />
        </section>

        <section>
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
        </section>

        <Controller
          control={control}
          name="tshirtColor"
          rules={{ required: intl.formatMessage({ id: 'hackathon.tshirt.required' }) }}
          render={({ field: colorField, fieldState: { error: colorError } }) => (
            <Controller
              control={control}
              name="tshirtSize"
              rules={{
                validate: (size, values) =>
                  !values.tshirtColor ||
                  values.tshirtColor === 'NONE' ||
                  Boolean(size) ||
                  intl.formatMessage({ id: 'hackathon.tshirt.size.required' }),
              }}
              render={({ field: sizeField, fieldState: { error: sizeError } }) => (
                <TshirtFields
                  color={colorField.value}
                  size={sizeField.value}
                  onColorChange={colorField.onChange}
                  onSizeChange={sizeField.onChange}
                  colorError={colorError?.message}
                  sizeError={sizeError?.message}
                  required
                />
              )}
            />
          )}
        />

        <Controller
          control={control}
          name="termsAccepted"
          rules={{
            validate: (accepted) =>
              accepted || intl.formatMessage({ id: 'hackathon.terms.required' }),
          }}
          render={({ field, fieldState: { error } }) => (
            <TermsField
              checked={field.value}
              onChange={field.onChange}
              error={error?.message}
              required
            />
          )}
        />

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
