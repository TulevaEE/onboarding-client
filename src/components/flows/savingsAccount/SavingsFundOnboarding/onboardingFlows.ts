// The launch switch for company onboarding: flipping this to true is the
// go-live. Enforced on the root route (chooser vs. personal flow), the chooser
// options, and at route level (a direct link to a disabled flow redirects).
const COMPANY_ONBOARDING_LAUNCHED = false;

// Pre-launch preview for the team: open any page with
// ?companyOnboardingPreview=true to see the launch state for the rest of the
// browser session (?companyOnboardingPreview=false turns it off). This only
// reveals the launch UI — it grants nothing the backend doesn't already allow.
const PREVIEW_SESSION_KEY = 'companyOnboardingPreview';

export const isCompanyOnboardingEnabled = (): boolean => {
  if (COMPANY_ONBOARDING_LAUNCHED) {
    return true;
  }
  const previewParameter = new URLSearchParams(window.location.search).get(PREVIEW_SESSION_KEY);
  if (previewParameter === 'true') {
    sessionStorage.setItem(PREVIEW_SESSION_KEY, 'true');
  } else if (previewParameter === 'false') {
    sessionStorage.removeItem(PREVIEW_SESSION_KEY);
  }
  return sessionStorage.getItem(PREVIEW_SESSION_KEY) === 'true';
};

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
  { key: 'child', route: '/savings-fund/onboarding/child', enabled: false },
];
