import { FC, useEffect, useState } from 'react';
import { useForm, FieldPath } from 'react-hook-form';
import { useHistory } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { captureException } from '@sentry/browser';
import { usePageTitle } from '../../../common/usePageTitle';
import { CitizenshipStep } from './CitizenshipStep';
import { ResidencyStep } from './ResidencyStep';
import { ContactDetailsStep } from './ContactDetailsStep';
import { PepStep } from './PepStep';
import { InvestmentGoalStep } from './InvestmentGoalStep';
import { InvestableAssetsStep } from './InvestableAssetsStep';
import { IncomeSourcesStep } from './IncomeSourcesStep';
import { TermsStep } from './TermsStep';
import { OnboardingFormData } from './types';
import {
  useMe,
  useSavingsFundOnboardingStatus,
  useSubmitSavingsFundOnboardingSurvey,
} from '../../../common/apiHooks';
import { transformFormDataToOnboardingSurveryCommand } from '../utils';
import { ErrorResponse } from '../../../common/apiModels';
import { Loader } from '../../../common';

export const SavingsFundOnboarding: FC = () => {
  usePageTitle('pageTitle.savingsFundOnboarding');

  const history = useHistory();
  const [activeSection, setActiveSection] = useState(0);
  const [submitError, setSubmitError] = useState<ErrorResponse | null>(null);

  const {
    mutateAsync: submitSurvey,
    isPending: submittingSurvey,
    error,
  } = useSubmitSavingsFundOnboardingSurvey();
  const {
    data: onboardingStatus,
    isLoading: loadingOnboardingStatus,
    refetch: refetchOnboardingStatus,
  } = useSavingsFundOnboardingStatus();
  const { data: user } = useMe();

  const { control, setValue, watch, handleSubmit, trigger } = useForm<OnboardingFormData>({
    mode: 'onChange',
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
      investmentGoals: null,
      investableAssets: null,
      sourceOfIncome: [],
      termsAccepted: false,
    },
  });

  const citizenship = watch('citizenship');
  const residencyCountry = watch('address.countryCode');

  const submitForm = handleSubmit(async (data) => {
    await submitSurvey(transformFormDataToOnboardingSurveryCommand(data));
  });

  useEffect(() => {
    if (onboardingStatus?.status === null) {
      history.push('/account');
    }

    if (onboardingStatus?.status === 'REJECTED' || onboardingStatus?.status === 'PENDING') {
      redirectToOutcome('pending');
    }

    if (onboardingStatus?.status === 'COMPLETED') {
      redirectToOutcome('success');
    }
  }, [onboardingStatus]);

  // Auto-set residency country to first citizenship
  useEffect(() => {
    if (!residencyCountry && citizenship.length > 0) {
      setValue('address.countryCode', citizenship[0]);
    }
  }, [citizenship, setValue]);

  useEffect(() => {
    if (user?.email) {
      setValue('email', user.email);
    }

    if (user?.phoneNumber) {
      setValue('phoneNumber', user.phoneNumber);
    }
  }, [user, setValue]);

  const steps: Array<{
    component: JSX.Element;
    fields: FieldPath<OnboardingFormData>[];
  }> = [
    {
      component: <CitizenshipStep key="citizenship" control={control} />,
      fields: ['citizenship'],
    },
    {
      component: <ResidencyStep key="residency" control={control} />,
      fields: ['address.countryCode', 'address.street', 'address.city', 'address.postalCode'],
    },
    {
      component: <ContactDetailsStep key="contact-details" control={control} />,
      fields: ['email'],
    },
    {
      component: <PepStep key="pep" control={control} />,
      fields: ['pepSelfDeclaration'],
    },
    {
      component: <InvestmentGoalStep key="investment-goal" control={control} />,
      fields: ['investmentGoals'],
    },
    {
      component: <InvestableAssetsStep key="investable-assets" control={control} />,
      fields: ['investableAssets'],
    },
    {
      component: <IncomeSourcesStep key="income-sources" control={control} />,
      fields: ['sourceOfIncome'],
    },
    {
      component: <TermsStep key="terms" control={control} />,
      fields: ['termsAccepted'],
    },
  ];

  const totalSections = steps.length;
  const currentSection = activeSection + 1;
  const progressPercentage = (currentSection / totalSections) * 100;
  const isFirstSection = activeSection === 0;

  const redirectToOutcome = (outcome: 'pending' | 'success') => {
    history.push(`/savings-fund/onboarding/${outcome}`);
  };

  const showPreviousSection = () => {
    if (isFirstSection) {
      history.push('/account');
      return;
    }

    setActiveSection((current) => Math.max(current - 1, 0));
  };

  const showNextSection = async () => {
    const fieldsToValidate = steps[activeSection].fields;
    const isStepValid = await trigger(fieldsToValidate);

    if (!isStepValid) {
      return;
    }

    if (activeSection === totalSections - 1) {
      try {
        setSubmitError(null);
        await submitForm();
        await refetchOnboardingStatus();
      } catch (e) {
        setSubmitError(error);
        captureException(e);
      }
      return;
    }

    setActiveSection((current) => Math.min(current + 1, totalSections - 1));
  };

  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto d-flex flex-column gap-5">
      <div className="d-flex flex-column gap-4">
        <div className="d-flex align-items-center gap-2">
          <div
            className="progress flex-fill"
            role="progressbar"
            aria-hidden="true"
            style={{ height: '8px' }}
          >
            <div className="progress-bar" style={{ width: `${progressPercentage}%` }} />
          </div>
          <span className="fs-xs lh-1 text-secondary fw-medium">
            <span className="visually-hidden">
              <FormattedMessage
                id="flows.savingsFundOnboarding.currentStep"
                values={{
                  currentStep: currentSection,
                  totalSteps: totalSections,
                }}
              />
            </span>{' '}
            {currentSection}/{totalSections}
          </span>
        </div>

        <h1 className="m-0">
          <FormattedMessage id="flows.savingsFundOnboarding.title" />
        </h1>
      </div>

      {!onboardingStatus && loadingOnboardingStatus ? <Loader /> : steps[activeSection].component}

      {submitError ? (
        <div className="alert alert-danger" role="alert">
          <FormattedMessage id="flows.savingsFundOnboarding.error" />
        </div>
      ) : null}

      <div className="d-flex flex-column-reverse flex-sm-row justify-content-between pt-4 border-top gap-3">
        <button type="button" className="btn btn-lg btn-light" onClick={showPreviousSection}>
          <FormattedMessage id="savingsFundOnboarding.back" />
        </button>
        <button
          type="button"
          className="btn btn-lg btn-primary"
          onClick={showNextSection}
          disabled={submittingSurvey}
        >
          {submittingSurvey ? (
            <span
              className="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            />
          ) : null}
          <FormattedMessage id="savingsFundOnboarding.continue" />
        </button>
      </div>
    </div>
  );
};
