// Launch switches for each onboarding flow. Both are live; the *Enabled helpers
// stay as the single gate the root route, chooser options, and switcher check.
const COMPANY_ONBOARDING_LAUNCHED = true;
const CHILD_ONBOARDING_LAUNCHED = true;

export const isCompanyOnboardingEnabled = (): boolean => COMPANY_ONBOARDING_LAUNCHED;

export const isChildOnboardingEnabled = (): boolean => CHILD_ONBOARDING_LAUNCHED;

export type OnboardingFlowOption = {
  key: 'person' | 'company' | 'child';
  route: string;
  enabled: boolean;
};

export const getOnboardingFlowOptions = (): OnboardingFlowOption[] => [
  { key: 'person', route: '/savings-fund/onboarding/person', enabled: true },
  {
    key: 'company',
    route: '/savings-fund/onboarding/company',
    enabled: isCompanyOnboardingEnabled(),
  },
  {
    key: 'child',
    route: '/savings-fund/onboarding/child',
    enabled: isChildOnboardingEnabled(),
  },
];

const FLOW_SELECTION_STORAGE_KEY = 'savingsFundOnboardingFlowSelection';

export const rememberOnboardingFlowSelection = (key: OnboardingFlowOption['key']): void => {
  sessionStorage.setItem(FLOW_SELECTION_STORAGE_KEY, key);
};

export const getRememberedOnboardingFlowSelection = (): OnboardingFlowOption['key'] | null => {
  const remembered = sessionStorage.getItem(FLOW_SELECTION_STORAGE_KEY);
  const option = getOnboardingFlowOptions().find(
    ({ key, enabled }) => key === remembered && enabled,
  );
  return option?.key ?? null;
};
