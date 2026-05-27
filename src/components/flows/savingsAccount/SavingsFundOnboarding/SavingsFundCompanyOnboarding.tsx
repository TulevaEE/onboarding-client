import { useEffect, useState } from 'react';
import { useForm, FieldPath } from 'react-hook-form';
import { useHistory } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { CompanyOnboardingFormData } from './types';
import { BusinessRegistryStep } from './BusinessRegistryStep';
import { RequirementsCheckStep } from './RequirementsCheckStep';
import { CompanyAddressStep } from './CompanyAddressStep';
import { InvestmentGoalStep } from './InvestmentGoalStep';
import { InvestableAssetsStep } from './InvestableAssetsStep';
import { CompanyIncomeSourceStep } from './CompanyIncomeSourceStep';
import { TermsStep } from './TermsStep';
import { AccountChoiceStep } from './AccountChoiceStep';
import { OnboardingWizardLayout } from './OnboardingWizardLayout';
import {
  useSavingsFundCompanyOnboardingStatus,
  useSubmitSavingsFundCompanyOnboardingSurvey,
} from '../../../common/apiHooks';
import { transformCompanyFormDataToSurveyCommand } from '../utils';

export const SavingsFundCompanyOnboarding = () => {
  const history = useHistory();
  const [activeSection, setActiveSection] = useState(0);
  const [submitError, setSubmitError] = useState(false);
  const [submittedRegistryCode, setSubmittedRegistryCode] = useState<string | undefined>(undefined);
  const [completedCompany, setCompletedCompany] = useState<{ code: string; name: string } | null>(
    null,
  );

  // Whether the user reached the company flow from the "both personal and
  // company" KYC path. Carried only in in-memory router state, so reloads or
  // direct entry (e.g. the role-switcher) fall back to direct company
  // onboarding without an account chooser.
  const locationState = history.location.state as { fromBothFlow?: boolean } | undefined;
  const fromBothFlow = locationState?.fromBothFlow ?? false;

  const { data: onboardingStatus } = useSavingsFundCompanyOnboardingStatus(submittedRegistryCode);
  const { mutateAsync: submitSurvey, isPending: submittingSurvey } =
    useSubmitSavingsFundCompanyOnboardingSurvey();

  useEffect(() => {
    if (onboardingStatus) {
      history.push('/savings-fund/onboarding/pending');
    }
  }, [onboardingStatus]);

  const { control, trigger, handleSubmit, watch } = useForm<CompanyOnboardingFormData>({
    mode: 'onChange',
    defaultValues: {
      registryLookup: undefined,
      companyValidatedData: undefined,
      companyAddress: { reuseBackendAddress: true },
      sourceOfCompanyIncome: {
        ONLY_ACTIVE_IN_ESTONIA: false,
        NOT_SANCTIONED_NOT_PROFITING_FROM_SANCTIONED_COUNTRIES: false,
        NOT_IN_CRYPTO: false,
      },
      termsAccepted: false,
    },
  });

  const termsAccepted = watch('termsAccepted');

  const submitForm = handleSubmit(async (data) => {
    const registryCode = data.registryLookup?.registryNumber ?? '';
    await submitSurvey({
      command: transformCompanyFormDataToSurveyCommand(data),
      registryCode,
    });
    if (fromBothFlow) {
      // Personal account already exists from the KYC step — let the user pick
      // which account to open next.
      setCompletedCompany({ code: registryCode, name: data.registryLookup?.registryName ?? '' });
    } else {
      setSubmittedRegistryCode(registryCode);
    }
  });

  const steps: Array<{
    component: JSX.Element;
    fields: FieldPath<CompanyOnboardingFormData>[];
  }> = [
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
          titleId="flows.savingsFundOnboarding.investmentGoalStep.titleCompany"
          options={[
            {
              value: 'LONG_TERM',
              labelId: 'flows.savingsFundOnboarding.investmentGoalStep.longTermCompany',
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
          documents={[
            {
              href: 'https://tuleva.ee/wp-content/uploads/2026/02/Tuleva.eurofond.tingimused.02.02.2026.pdf',
              labelId: 'flows.savingsFundOnboarding.termsStep.linkText.terms',
            },
            {
              href: 'https://tuleva.ee/wp-content/uploads/2026/02/TKF100-Prospekt-kehtib-alates-27.02.2026.pdf',
              labelId: 'flows.savingsFundOnboarding.termsStep.linkText.prospectus',
            },
            {
              href: 'https://tuleva.ee/wp-content/uploads/2026/02/Pohiteave-TKF100-kehtib-alates-27.02.2026.pdf',
              labelId: 'flows.savingsFundOnboarding.termsStep.linkText.keyInfo',
            },
          ]}
        />
      ),
      fields: ['termsAccepted'],
    },
  ];

  const totalSections = steps.length;
  const currentSection = activeSection + 1;
  const isTermsStep = activeSection === totalSections - 1;

  const showPreviousSection = () => {
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
    if (activeSection === totalSections - 1) {
      try {
        setSubmitError(false);
        await submitForm();
      } catch (e) {
        setSubmitError(true);
      }
      return;
    }
    setActiveSection((current) => Math.min(current + 1, totalSections - 1));
  };

  if (completedCompany) {
    return (
      <div className="col-12 col-md-10 col-lg-7 mx-auto">
        <AccountChoiceStep
          companyCode={completedCompany.code}
          companyName={completedCompany.name}
        />
      </div>
    );
  }

  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto">
      <OnboardingWizardLayout
        currentStep={currentSection}
        totalSteps={totalSections}
        onBack={showPreviousSection}
        onNext={showNextSection}
        submitting={submittingSurvey}
        nextDisabled={isTermsStep && !termsAccepted}
      >
        {steps[activeSection].component}

        {submitError ? (
          <div className="alert alert-danger" role="alert">
            <FormattedMessage id="flows.savingsFundOnboarding.error" />
          </div>
        ) : null}
      </OnboardingWizardLayout>
    </div>
  );
};
