import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import {
  useHackathonIdeas,
  useHackathonRegistration,
  useMe,
  useSaveHackathonRegistration,
  useSubmitHackathonIdea,
} from '../common/apiHooks';
import {
  HackathonChallenge,
  HackathonSkill,
  HackathonTshirtColor,
  HackathonTshirtSize,
} from '../common/apiModels/hackathon';
import Radio from '../common/radio/Radio';
import { Loader } from '../common';
import { usePageTitle } from '../common/usePageTitle';
import { TranslationKey } from '../translations';
import {
  CHALLENGES,
  FieldError,
  HackathonHeading,
  HackathonMembersOnly,
  SkillCheckboxes,
  TermsField,
  trimmedOrNull,
  TshirtFields,
} from './HackathonFormFields';

type IdeaFormData = {
  challenge: HackathonChallenge | null;
  problem: string;
  solution: string;
  progress: string;
  neededSkills: HackathonSkill[];
  additionalInfo: string;
  email: string;
  skills: HackathonSkill[];
  tshirtColor: HackathonTshirtColor | null;
  tshirtSize: HackathonTshirtSize | '';
  termsAccepted: boolean;
};

const IDEA_CHALLENGES: { value: HackathonChallenge; labelId: TranslationKey }[] = [
  ...CHALLENGES,
  { value: 'OTHER', labelId: 'hackathon.challenge.other' },
];

const challengeLabel = (challenge: HackathonChallenge): TranslationKey =>
  IDEA_CHALLENGES.find(({ value }) => value === challenge)?.labelId ?? 'hackathon.challenge.other';

const EMPTY_IDEA = {
  challenge: null,
  problem: '',
  solution: '',
  progress: '',
  neededSkills: [],
  additionalInfo: '',
};

type SubmitStatus = 'idle' | 'submitting' | 'submitted' | 'failed';

export const HackathonIdeaPage = () => {
  usePageTitle('pageTitle.hackathon');

  const intl = useIntl();
  const { data: user } = useMe();
  const isMember = Boolean(user?.memberNumber);
  const registrationQuery = useHackathonRegistration(isMember);
  const ideasQuery = useHackathonIdeas(isMember);
  const { mutateAsync: saveRegistration } = useSaveHackathonRegistration();
  const { mutateAsync: submitIdea } = useSubmitHackathonIdea();
  const [status, setStatus] = useState<SubmitStatus>('idle');

  const { control, handleSubmit, reset, getValues } = useForm<IdeaFormData>({
    mode: 'onChange',
    defaultValues: {
      ...EMPTY_IDEA,
      email: '',
      skills: [],
      tshirtColor: null,
      tshirtSize: '',
      termsAccepted: false,
    },
  });

  const registration = registrationQuery.data;
  const ideas = ideasQuery.data;
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (registration && !prefilled) {
      setPrefilled(true);
      reset({
        ...getValues(),
        email: registration.email ?? '',
        skills: registration.skills,
        tshirtColor: registration.tshirtColor,
        tshirtSize: registration.tshirtSize ?? '',
        termsAccepted: registration.termsAccepted,
      });
    }
  }, [registration, prefilled, reset, getValues]);

  const needsRegistration = Boolean(registration && !registration.registered);

  const submit = handleSubmit(async (data) => {
    setStatus('submitting');
    try {
      if (needsRegistration && registration) {
        await saveRegistration({
          email: data.email.trim(),
          phoneNumber: registration.phoneNumber,
          role: 'PARTICIPANT',
          skills: data.skills,
          challenges: data.challenge && data.challenge !== 'OTHER' ? [data.challenge] : [],
          participation: 'WITH_IDEA',
          idea: null,
          linkedinUrl: null,
          tshirtColor: data.tshirtColor as HackathonTshirtColor,
          tshirtSize: data.tshirtColor === 'NONE' ? null : data.tshirtSize || null,
          termsAccepted: data.termsAccepted,
        });
      }
      await submitIdea({
        challenge: data.challenge as HackathonChallenge,
        problem: data.problem.trim(),
        solution: data.solution.trim(),
        progress: trimmedOrNull(data.progress),
        neededSkills: data.neededSkills,
        additionalInfo: trimmedOrNull(data.additionalInfo),
      });
      reset({ ...data, ...EMPTY_IDEA });
      setStatus('submitted');
    } catch {
      setStatus('failed');
    }
  });

  if (user && !isMember) {
    return <HackathonMembersOnly titleId="hackathon.idea.title" />;
  }

  if (registrationQuery.isLoading || ideasQuery.isLoading) {
    return <Loader className="align-middle" />;
  }

  if (registrationQuery.isError || ideasQuery.isError || !registration || !ideas) {
    return (
      <div className="col-12 col-md-11 col-lg-8 mx-auto py-4">
        <HackathonHeading titleId="hackathon.idea.title" />
        <div className="alert alert-danger mt-4" role="alert">
          <FormattedMessage id="hackathon.loadFailed" />
        </div>
      </div>
    );
  }

  if (!ideas.open || (needsRegistration && !registration.open)) {
    return (
      <div className="col-12 col-md-11 col-lg-8 mx-auto py-4">
        <HackathonHeading titleId="hackathon.idea.title" />
        <div className="card p-4 mt-4">
          <h2 className="mt-0 mb-2 fs-3">
            <FormattedMessage id="hackathon.idea.closed.title" />
          </h2>
          <p className="m-0">
            <FormattedMessage
              id="hackathon.idea.closed.description"
              values={{
                deadline: (
                  <FormattedDate
                    value={new Date(ideas.deadline)}
                    day="numeric"
                    month="long"
                    timeZone="Europe/Tallinn"
                  />
                ),
              }}
            />
          </p>
          <div className="mt-4">
            <Link className="btn btn-outline-primary" to="/hackathon">
              <FormattedMessage id="hackathon.idea.backToRegistration" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="col-12 col-md-11 col-lg-8 mx-auto py-4">
      <HackathonHeading titleId="hackathon.idea.title" />

      {status === 'submitted' && (
        <div className="alert alert-success mt-4" role="status">
          <FormattedMessage id="hackathon.idea.submitted" />
        </div>
      )}

      {ideas.ideas.length > 0 && (
        <section className="card p-4 mt-4">
          <h2 className="m-0 fs-3" id="hackathon-idea-mine-title">
            <FormattedMessage id="hackathon.idea.mine.title" />
          </h2>
          <ul className="mt-2 mb-0 ps-3" aria-labelledby="hackathon-idea-mine-title">
            {ideas.ideas.map((idea) => (
              <li key={idea.id}>
                <strong>
                  <FormattedMessage id={challengeLabel(idea.challenge)} />
                </strong>
                : {idea.solution}
              </li>
            ))}
          </ul>
        </section>
      )}

      <form onSubmit={submit} className="d-flex flex-column gap-4 mt-4">
        <section className="d-flex flex-column gap-2">
          <h2 className="m-0 fs-3" id="hackathon-idea-challenge-title">
            <FormattedMessage id="hackathon.idea.challenge.title" />
          </h2>
          <Controller
            control={control}
            name="challenge"
            rules={{ required: intl.formatMessage({ id: 'hackathon.idea.challenge.required' }) }}
            render={({ field, fieldState: { error } }) => (
              <div
                className="d-flex flex-column gap-2"
                role="radiogroup"
                aria-labelledby="hackathon-idea-challenge-title"
                aria-describedby={error ? 'hackathon-idea-challenge-error' : undefined}
              >
                {IDEA_CHALLENGES.map(({ value, labelId }) => (
                  <Radio
                    key={value}
                    name="hackathon-idea-challenge"
                    id={`hackathon-idea-challenge-${value}`}
                    selected={field.value === value}
                    onSelect={() => field.onChange(value)}
                  >
                    <span className="fs-3 lh-sm">
                      <FormattedMessage id={labelId} />
                    </span>
                  </Radio>
                ))}
                <FieldError id="hackathon-idea-challenge-error" message={error?.message} />
              </div>
            )}
          />
        </section>

        <IdeaTextarea
          control={control}
          name="problem"
          labelId="hackathon.idea.problem.label"
          requiredId="hackathon.idea.problem.required"
        />
        <IdeaTextarea
          control={control}
          name="solution"
          labelId="hackathon.idea.solution.label"
          requiredId="hackathon.idea.solution.required"
        />
        <IdeaTextarea control={control} name="progress" labelId="hackathon.idea.progress.label" />

        <section className="d-flex flex-column gap-2">
          <h2 className="m-0 fs-3" id="hackathon-idea-needed-skills-title">
            <FormattedMessage id="hackathon.idea.neededSkills.title" />
          </h2>
          <Controller
            control={control}
            name="neededSkills"
            render={({ field }) => (
              <SkillCheckboxes
                idPrefix="hackathon-idea-needed-skill"
                labelledBy="hackathon-idea-needed-skills-title"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </section>

        <IdeaTextarea
          control={control}
          name="additionalInfo"
          labelId="hackathon.idea.additionalInfo.label"
        />

        {needsRegistration && (
          <>
            <section className="d-flex flex-column gap-2">
              <h2 className="m-0 fs-3">
                <FormattedMessage id="hackathon.idea.aboutYou.title" />
              </h2>
              <p className="m-0 text-body-secondary">
                <FormattedMessage id="hackathon.idea.aboutYou.description" />
              </p>
              <label className="form-label mt-2" htmlFor="hackathon-idea-email">
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
                      id="hackathon-idea-email"
                      type="email"
                      className="form-control form-control-lg"
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? 'hackathon-idea-email-error' : undefined}
                    />
                    <FieldError id="hackathon-idea-email-error" message={error?.message} />
                  </>
                )}
              />
            </section>

            <section className="d-flex flex-column gap-2">
              <h2 className="m-0 fs-3" id="hackathon-idea-own-skills-title">
                <FormattedMessage id="hackathon.idea.ownSkills.title" />
              </h2>
              <Controller
                control={control}
                name="skills"
                render={({ field }) => (
                  <SkillCheckboxes
                    idPrefix="hackathon-idea-own-skill"
                    labelledBy="hackathon-idea-own-skills-title"
                    value={field.value}
                    onChange={field.onChange}
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
                />
              )}
            />
          </>
        )}

        {status === 'failed' && (
          <div className="alert alert-danger" role="alert">
            <FormattedMessage id="hackathon.saveFailed" />
          </div>
        )}

        <div>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={status === 'submitting'}
          >
            {status === 'submitting' && (
              <span className="spinner-border spinner-border-sm me-2" aria-hidden />
            )}
            <FormattedMessage id="hackathon.idea.submit" />
          </button>
        </div>
      </form>
    </div>
  );
};

type IdeaTextField = 'problem' | 'solution' | 'progress' | 'additionalInfo';

const IdeaTextarea = ({
  control,
  name,
  labelId,
  requiredId,
}: {
  control: ReturnType<typeof useForm<IdeaFormData>>['control'];
  name: IdeaTextField;
  labelId: TranslationKey;
  requiredId?: TranslationKey;
}) => {
  const intl = useIntl();
  const id = `hackathon-idea-${name}`;

  return (
    <section>
      <label className="form-label" htmlFor={id}>
        <FormattedMessage id={labelId} />
      </label>
      <Controller
        control={control}
        name={name}
        rules={{
          required: requiredId ? intl.formatMessage({ id: requiredId }) : undefined,
          maxLength: 2000,
        }}
        render={({ field, fieldState: { error } }) => (
          <>
            <textarea
              {...field}
              id={id}
              rows={4}
              maxLength={2000}
              className="form-control form-control-lg"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${id}-error` : undefined}
            />
            <div className="mt-1">
              <FieldError id={`${id}-error`} message={error?.message} />
            </div>
          </>
        )}
      />
    </section>
  );
};
