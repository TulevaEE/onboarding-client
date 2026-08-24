import { FC, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormattedMessage } from 'react-intl';
import { captureException } from '@sentry/browser';
import { Loader } from '../../../common';
import { StatusAlert } from '../../../common/statusAlert';
import { usePageTitle } from '../../../common/usePageTitle';
import { TranslationKey } from '../../../translations';
import { IdentityFormFields } from './types';
import { IdentityLoadError, buildIdentitySteps, useIdentityOnFile } from './identitySteps';
import { OnboardingFlowLayout } from './OnboardingFlowLayout';
import { useSubmitSavingsFundOnboardingSurvey } from '../../../common/apiHooks';
import { transformIdentityToOnboardingSurveyCommand } from '../utils';

type OutcomeVariant = 'justVerified' | 'alreadyVerified';

const outcomeCopy: Record<
  OutcomeVariant,
  { titleId: TranslationKey; descriptionId: TranslationKey }
> = {
  justVerified: {
    titleId: 'savingsFund.identityVerification.done.title',
    descriptionId: 'savingsFund.identityVerification.done.description',
  },
  alreadyVerified: {
    titleId: 'savingsFund.identityVerification.alreadyDone.title',
    descriptionId: 'savingsFund.identityVerification.alreadyDone.description',
  },
};

const Outcome: FC<{ variant: OutcomeVariant }> = ({ variant }) => {
  const { titleId, descriptionId } = outcomeCopy[variant];

  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto">
      <StatusAlert
        title={<FormattedMessage id={titleId} />}
        actions={
          <a href="/account" className="btn btn-outline-primary">
            <FormattedMessage id="savingsFund.identityVerification.accountButton.label" />
          </a>
        }
      >
        <p>
          <FormattedMessage id={descriptionId} />
        </p>
      </StatusAlert>
    </div>
  );
};

// Identity verification on its own, for someone connected to a company that is
// applying to the savings fund. It submits the same four identity steps as the
// personal and company flows, but as IDENTITY_ONLY: that runs the KYC screening
// and persists the KYC_CHECK the company's RELATED_PERSONS_KYC requirement
// reads, while deliberately leaving this person's own savings-fund onboarding
// untouched. Joining the fund is never a side effect of helping a co-owner.
// The backend guarantees that split in SavingsFundKycCheckEventListener, which
// ignores every purpose other than PERSONAL_ONBOARDING.
export const SavingsFundIdentityVerification: FC = () => {
  usePageTitle('pageTitle.savingsFundIdentityVerification');

  const [activeSection, setActiveSection] = useState(0);
  const [submitError, setSubmitError] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const submitBlocked = useRef(false);

  const { mutateAsync: submitSurvey, isPending: submitting } =
    useSubmitSavingsFundOnboardingSurvey();

  const { control, setValue, trigger, getValues } = useForm<IdentityFormFields>({
    mode: 'onSubmit',
    defaultValues: {
      citizenship: [],
      address: {
        countryCode: 'EE',
        street: '',
        city: '',
        postalCode: '',
      },
      email: '',
      phoneNumber: '',
      pepSelfDeclaration: null,
    },
  });

  const { identityOnFile, identityLoadFailed, retryIdentityLoad } = useIdentityOnFile(setValue);

  const steps = buildIdentitySteps<IdentityFormFields>(control);
  const totalSections = steps.length;

  const showPreviousSection = () => {
    setActiveSection((current) => Math.max(current - 1, 0));
    if (submitError) {
      setSubmitError(false);
    }
  };

  const showNextSection = async () => {
    const isStepValid = await trigger(steps[activeSection].fields);
    if (!isStepValid) {
      return;
    }

    if (activeSection < totalSections - 1) {
      // A second click arriving while the validation above was still running
      // carries the same activeSection, so advancing unconditionally would skip
      // the next step without ever validating it. Only the click that still
      // matches the rendered step may advance.
      setActiveSection((current) => (current === activeSection ? current + 1 : current));
      return;
    }

    // isPending only disables the button on the next render, which is too late
    // to stop a double-click from posting the survey twice.
    if (submitBlocked.current) {
      return;
    }
    submitBlocked.current = true;
    try {
      setSubmitError(false);
      await submitSurvey(transformIdentityToOnboardingSurveyCommand(getValues()));
      setSubmitted(true);
    } catch (e) {
      submitBlocked.current = false;
      setSubmitError(true);
      captureException(e);
    }
  };

  if (identityLoadFailed) {
    return <IdentityLoadError onRetry={retryIdentityLoad} />;
  }

  // The identity fetch is frozen per mount by useIdentityOnFile, so it never
  // flips to true after this submit — the outcome has to come from our own flag.
  if (submitted) {
    return <Outcome variant="justVerified" />;
  }

  // Nothing left to collect: say so rather than walking them through four steps
  // that would only re-submit what is already on file.
  if (identityOnFile === true) {
    return <Outcome variant="alreadyVerified" />;
  }

  // Which of the three outcomes above applies is not known until the identity
  // resolves, so show nothing but a loader rather than a progress bar the
  // already-verified visitor would never have needed.
  if (identityOnFile === null) {
    return <Loader className="align-middle" />;
  }

  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto">
      <OnboardingFlowLayout
        titleId="flows.savingsFundIdentityVerification.title"
        currentStep={activeSection + 1}
        totalSteps={totalSections}
        onBack={showPreviousSection}
        onNext={showNextSection}
        backDisabled={activeSection === 0 || submitting}
        submitting={submitting}
      >
        {steps[activeSection].component}

        {submitError ? (
          <div className="alert alert-danger" role="alert">
            <FormattedMessage id="flows.savingsFundOnboarding.error" />
          </div>
        ) : null}
      </OnboardingFlowLayout>
    </div>
  );
};
