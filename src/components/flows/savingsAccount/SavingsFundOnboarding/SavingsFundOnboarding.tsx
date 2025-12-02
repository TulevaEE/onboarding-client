import { FC, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useHistory } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
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

export const SavingsFundOnboarding: FC = () => {
  usePageTitle('pageTitle.savingsFundOnboarding');

  const history = useHistory();
  const [showTermsError, setShowTermsError] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  const { control, setValue, watch } = useForm<OnboardingFormData>({
    mode: 'onBlur',
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
  const hasAcceptedTerms = watch('termsAccepted');

  // Auto-set residency country to first citizenship
  useEffect(() => {
    if (!residencyCountry && citizenship.length > 0) {
      setValue('address.countryCode', citizenship[0]);
    }
  }, [citizenship, setValue]);

  const sections = [
    <CitizenshipStep key="citizenship" control={control} />,
    <ResidencyStep key="residency" control={control} />,
    <ContactDetailsStep key="contact-details" control={control} />,
    <PepStep key="pep" control={control} />,
    <InvestmentGoalStep key="investment-goal" control={control} />,
    <InvestableAssetsStep key="investable-assets" control={control} />,
    <IncomeSourcesStep key="income-sources" control={control} />,
    <TermsStep key="terms" control={control} showError={showTermsError} />,
  ];

  const totalSections = sections.length;
  const currentSection = activeSection + 1;
  const progressPercentage = (currentSection / totalSections) * 100;
  const isFirstSection = activeSection === 0;

  const redirectToOutcome = (outcome: 'pending' | 'success') => {
    history.push(`/savings-fund/onboarding/${outcome}`);
  };

  const showPreviousSection = () => {
    setShowTermsError(false);
    if (isFirstSection) {
      history.push('/account');
      return;
    }

    setActiveSection((current) => Math.max(current - 1, 0));
  };

  const showNextSection = async () => {
    if (activeSection === totalSections - 1) {
      if (!hasAcceptedTerms) {
        setShowTermsError(true);
        return;
      }

      setShowTermsError(false);
      redirectToOutcome('success');
      return;
    }

    // TODO: Validate current section before proceeding
    // TODO: Add submission

    setShowTermsError(false);
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

      {sections[activeSection]}

      <div className="d-flex flex-column-reverse flex-sm-row justify-content-between pt-4 border-top gap-3">
        <button type="button" className="btn btn-lg btn-light" onClick={showPreviousSection}>
          <FormattedMessage id="savingsFundOnboarding.back" />
        </button>
        <button type="button" className="btn btn-lg btn-primary" onClick={showNextSection}>
          <FormattedMessage id="savingsFundOnboarding.continue" />
        </button>
      </div>
    </div>
  );
};
