import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useHistory } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { useQueryClient } from '@tanstack/react-query';
import { captureException } from '@sentry/browser';
import { CompanyOnboardingFormData } from './types';
import { BusinessRegistryStep } from './BusinessRegistryStep';
import { RequirementsCheckStep } from './RequirementsCheckStep';
import { mayPassRequirementsStep } from './RequirementsCheckStep/mayPassRequirementsStep';
import { applicantIdentityUnderReview } from './RequirementsCheckStep/applicantIdentityUnderReview';
import { CompanyAddressStep } from './CompanyAddressStep';
import { InvestmentGoalStep } from './InvestmentGoalStep';
import { InvestableAssetsStep } from './InvestableAssetsStep';
import { CompanyIncomeSourceStep } from './CompanyIncomeSourceStep';
import { TermsStep } from './TermsStep';
import { OnboardingFlowLayout } from './OnboardingFlowLayout';
import { TKF_DOCUMENTS } from './tkfDocuments';
import {
  useSubmitSavingsFundCompanyOnboardingSurvey,
  useSubmitSavingsFundOnboardingSurvey,
  useSwitchRole,
} from '../../../common/apiHooks';
import {
  getCompanyBusinessRegistryValidation,
  getSavingsFundCompanyOnboardingStatus,
} from '../../../common/api';
import { SavingsFundOnboardingStatus } from '../../../common/apiModels';
import { BusinessRegistryValidatedData } from '../../../common/apiModels/company-onboarding';
import {
  transformCompanyFormDataToSurveyCommand,
  transformIdentityToOnboardingSurveyCommand,
} from '../utils';
import {
  IdentityLoadError,
  OnboardingStep,
  buildIdentitySteps,
  useIdentityOnFile,
} from './identitySteps';

const REPORT_DEADLINE_MS = 5000;

export const SavingsFundCompanyOnboarding = () => {
  const history = useHistory();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState(0);
  const [submitError, setSubmitError] = useState(false);
  const [awaitingApplicationOutcome, setAwaitingApplicationOutcome] = useState(false);

  const { mutateAsync: submitSurvey } = useSubmitSavingsFundCompanyOnboardingSurvey();
  const { mutateAsync: submitIdentitySurvey, isPending: submittingIdentity } =
    useSubmitSavingsFundOnboardingSurvey();
  const { mutateAsync: switchRole } = useSwitchRole();

  const { control, trigger, watch, setValue, getValues } = useForm<CompanyOnboardingFormData>({
    // Validate on submit (each "Continue" triggers validation explicitly), so a
    // half-filled confirmations step doesn't flash an error after the first
    // checkbox; reValidateMode then clears the error as the user ticks the rest.
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
      registryLookup: undefined,
      companyValidatedData: undefined,
      companyAddress: { reuseBackendAddress: true },
      investmentGoals: null,
      investableAssets: null,
      sourceOfCompanyIncome: {
        ONLY_ACTIVE_IN_ESTONIA: false,
        NOT_SANCTIONED_NOT_PROFITING_FROM_SANCTIONED_COUNTRIES: false,
        NOT_IN_CRYPTO: false,
      },
      termsAccepted: false,
    },
  });

  const termsAccepted = watch('termsAccepted');
  const companyValidatedData = watch('companyValidatedData');

  // A company-first applicant may not be identified yet: collect the identity
  // steps inline and submit them as IDENTITY_ONLY before the KYB steps — the
  // screening runs without touching the person's own onboarding status.
  const { identityOnFile, identityLoadFailed, retryIdentityLoad } = useIdentityOnFile(setValue);
  const lastSubmittedIdentity = useRef<string | null>(null);
  const lastSubmittedApplication = useRef<string | null>(null);
  const applicationInFlight = useRef(false);
  const stillOnTheFlow = useRef(true);

  useEffect(
    () => () => {
      stillOnTheFlow.current = false;
    },
    [],
  );

  const applicantLeftTheFlow = () => !stillOnTheFlow.current;

  const fetchFreshApplicationStatus = (registryCode: string) =>
    queryClient.fetchQuery({
      queryKey: ['savingsFundCompanyOnboardingStatus', registryCode],
      queryFn: () => getSavingsFundCompanyOnboardingStatus(registryCode),
      staleTime: 0,
    });

  // Not fetchQuery: react-query would dedupe onto an in-flight pre-submission refetch.
  const freshValidationReportOrRequirementsStepReport = (registryCode: string) => {
    const requirementsStepReport = companyValidatedData;
    const abandonTheFreshReport = new AbortController();
    let stopWaitingForTheFreshReport = () => {};
    const requirementsStepReportOnceTheReportIsLate = new Promise<
      BusinessRegistryValidatedData | undefined
    >((resolve) => {
      const deadline = setTimeout(() => {
        abandonTheFreshReport.abort();
        resolve(requirementsStepReport);
      }, REPORT_DEADLINE_MS);
      stopWaitingForTheFreshReport = () => clearTimeout(deadline);
    });
    const freshReportOrRequirementsStepReport = getCompanyBusinessRegistryValidation(
      registryCode,
      abandonTheFreshReport.signal,
    )
      .catch(() => requirementsStepReport)
      .finally(() => stopWaitingForTheFreshReport());
    return Promise.race([
      freshReportOrRequirementsStepReport,
      requirementsStepReportOnceTheReportIsLate,
    ]);
  };

  const followApplicationStatus = async (
    status: SavingsFundOnboardingStatus['status'],
    registryCode: string,
    report: BusinessRegistryValidatedData | undefined,
  ) => {
    switch (status) {
      case 'COMPLETED':
        // KYB passed — switch to the new company account first, so the success
        // page's deposit CTA opens the company's deposit view and the deposit is
        // unambiguously to the company (TKF #67 F7).
        await switchRole({ type: 'LEGAL_ENTITY', code: registryCode });
        if (applicantLeftTheFlow()) {
          return;
        }
        history.push('/savings-fund/onboarding/success/company');
        return;
      case 'PENDING':
        history.push(
          report != null && applicantIdentityUnderReview(report)
            ? '/savings-fund/onboarding/pending'
            : '/savings-fund/onboarding/waiting',
        );
        return;
      case 'REJECTED':
        // Show the generic "we'll review it" outcome rather than surfacing a
        // hard rejection.
        history.push('/savings-fund/onboarding/pending');
        return;
      case null:
        throw new Error('Company onboarding has no status after the survey was submitted');
      default: {
        const unhandledStatus: never = status;
        throw new Error(`Unhandled company onboarding status: ${String(unhandledStatus)}`);
      }
    }
  };

  const finishApplication = async () => {
    if (applicationInFlight.current) {
      return;
    }
    applicationInFlight.current = true;
    setAwaitingApplicationOutcome(true);
    setSubmitError(false);
    try {
      const data = getValues();
      const registryCode = data.registryLookup?.registryNumber ?? '';
      const survey = transformCompanyFormDataToSurveyCommand(data);
      const application = JSON.stringify({ registryCode, survey });
      const alreadyScreened = application === lastSubmittedApplication.current;
      if (!alreadyScreened) {
        await submitSurvey({ command: survey, registryCode });
        lastSubmittedApplication.current = application;
      }
      const report = await freshValidationReportOrRequirementsStepReport(registryCode);
      if (applicantLeftTheFlow()) {
        return;
      }
      const { status } = await fetchFreshApplicationStatus(registryCode);
      if (applicantLeftTheFlow()) {
        return;
      }
      await followApplicationStatus(status, registryCode, report);
    } catch (e) {
      captureException(e);
      if (applicantLeftTheFlow()) {
        return;
      }
      applicationInFlight.current = false;
      setAwaitingApplicationOutcome(false);
      setSubmitError(true);
    }
  };

  const identitySteps =
    identityOnFile === true ? [] : buildIdentitySteps<CompanyOnboardingFormData>(control);

  const companySteps: OnboardingStep<CompanyOnboardingFormData>[] = [
    {
      component: <BusinessRegistryStep key="registry" control={control} />,
      fields: ['registryLookup'],
    },
    {
      component: <RequirementsCheckStep key="requirements" control={control} />,
      fields: ['companyValidatedData'],
    },
    {
      component: <CompanyAddressStep key="address" control={control} />,
      fields: ['companyAddress'],
    },
    {
      component: (
        <InvestmentGoalStep
          key="investmentGoal"
          control={control}
          name="investmentGoals"
          titleId="flows.savingsFundOnboarding.investmentGoalStep.titleCompany"
          options={[
            {
              value: 'LONG_TERM',
              labelId: 'flows.savingsFundOnboarding.investmentGoalStep.longTermCompany',
            },
            {
              value: 'ASSET_MANAGEMENT',
              labelId: 'flows.savingsFundOnboarding.investmentGoalStep.assetManagementCompany',
            },
            {
              value: 'SPECIFIC_GOAL',
              labelId: 'flows.savingsFundOnboarding.investmentGoalStep.specificGoalCompany',
            },
            {
              value: 'TRADING',
              labelId: 'flows.savingsFundOnboarding.investmentGoalStep.activeTrading',
            },
          ]}
        />
      ),
      fields: ['investmentGoals'],
    },
    {
      component: (
        <InvestableAssetsStep
          key="investableAssets"
          control={control}
          name="investableAssets"
          titleId="flows.savingsFundOnboarding.investableAssetsStep.titleCompany"
          options={[
            {
              value: 'LESS_THAN_20K',
              labelId: 'flows.savingsFundOnboarding.investableAssetsStep.upTo20k',
            },
            {
              value: 'RANGE_20K_40K',
              labelId: 'flows.savingsFundOnboarding.investableAssetsStep.from20kTo40k',
            },
            {
              value: 'RANGE_40K_80K',
              labelId: 'flows.savingsFundOnboarding.investableAssetsStep.from40kTo80k',
            },
            {
              value: 'MORE_THAN_80K',
              labelId: 'flows.savingsFundOnboarding.investableAssetsStep.over80k',
            },
          ]}
        />
      ),
      fields: ['investableAssets'],
    },
    {
      component: <CompanyIncomeSourceStep key="incomeSource" control={control} />,
      fields: ['sourceOfCompanyIncome'],
    },
    {
      component: (
        <TermsStep
          key="terms"
          control={control}
          confirmTextId="flows.savingsFundOnboarding.termsStep.confirmTextCompany"
          documents={TKF_DOCUMENTS}
        />
      ),
      fields: ['termsAccepted'],
    },
  ];

  const steps = [...identitySteps, ...companySteps];
  const identityStepCount = identitySteps.length;
  const isLastIdentityStep = identityStepCount > 0 && activeSection === identityStepCount - 1;

  const totalSections = steps.length;
  const currentSection = activeSection + 1;
  const isTermsStep = activeSection === totalSections - 1;
  const requirementsStepBlocked =
    activeSection === identityStepCount + 1 &&
    companyValidatedData != null &&
    !mayPassRequirementsStep(companyValidatedData);

  const showPreviousSection = () => {
    if (activeSection === 0) {
      // First step: back to wherever the user came from (normally the chooser).
      history.goBack();
      return;
    }
    setActiveSection((current) => Math.max(current - 1, 0));
    if (submitError) {
      setSubmitError(false);
    }
  };

  const showNextSection = async () => {
    const fieldsToValidate = steps[activeSection].fields;
    const isStepValid = await trigger(fieldsToValidate);
    if (!isStepValid) {
      return;
    }
    if (isTermsStep) {
      await finishApplication();
      return;
    }
    if (isLastIdentityStep) {
      // Crossing from identity into KYB: persist the identity first and wait —
      // the KYB requirements check reads the screening this submission creates.
      // Re-crossing with unchanged answers skips the resubmit, so going back and
      // forth does not pile up duplicate surveys and screenings.
      const identityCommand = transformIdentityToOnboardingSurveyCommand(getValues());
      const identityPayload = JSON.stringify(identityCommand);
      if (identityPayload !== lastSubmittedIdentity.current) {
        try {
          setSubmitError(false);
          await submitIdentitySurvey(identityCommand);
          lastSubmittedIdentity.current = identityPayload;
        } catch (e) {
          captureException(e);
          setSubmitError(true);
          return;
        }
      }
    }
    setActiveSection((current) => Math.min(current + 1, totalSections - 1));
  };

  if (identityLoadFailed) {
    return <IdentityLoadError onRetry={retryIdentityLoad} />;
  }

  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto">
      <OnboardingFlowLayout
        currentStep={currentSection}
        totalSteps={totalSections}
        onBack={showPreviousSection}
        onNext={showNextSection}
        loading={identityOnFile === null}
        submitting={awaitingApplicationOutcome || submittingIdentity}
        nextDisabled={(isTermsStep && !termsAccepted) || requirementsStepBlocked}
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
