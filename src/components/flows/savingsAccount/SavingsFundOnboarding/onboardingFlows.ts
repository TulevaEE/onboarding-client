// The launch switches for each onboarding flow: flipping one to true is the
// go-live. Enforced on the root route (chooser vs. personal flow), the chooser
// options, and at route level (a direct link to a disabled flow redirects).
const COMPANY_ONBOARDING_LAUNCHED = true;
// Child onboarding stays hidden until the backend (custody verification, the
// FUNDING_SOURCES/PLANNED_CONTRIBUTION survey items) lands. Until then it is
// reachable only via ?childOnboardingPreview=true (see below).
const CHILD_ONBOARDING_LAUNCHED = false;

// Pre-launch preview for the team: open any page with ?<key>=true to see the
// launch state for the rest of the browser session (?<key>=false turns it off).
// This only reveals the launch UI — it grants nothing the backend doesn't allow.
const COMPANY_PREVIEW_SESSION_KEY = 'companyOnboardingPreview';
const CHILD_PREVIEW_SESSION_KEY = 'childOnboardingPreview';

const isPreviewEnabled = (sessionKey: string): boolean => {
  const previewParameter = new URLSearchParams(window.location.search).get(sessionKey);
  if (previewParameter === 'true') {
    sessionStorage.setItem(sessionKey, 'true');
  } else if (previewParameter === 'false') {
    sessionStorage.removeItem(sessionKey);
  }
  return sessionStorage.getItem(sessionKey) === 'true';
};

export const isCompanyOnboardingEnabled = (): boolean =>
  COMPANY_ONBOARDING_LAUNCHED || isPreviewEnabled(COMPANY_PREVIEW_SESSION_KEY);

export const isChildOnboardingEnabled = (): boolean =>
  CHILD_ONBOARDING_LAUNCHED || isPreviewEnabled(CHILD_PREVIEW_SESSION_KEY);

// Persist any ?<key>=true|false preview override into sessionStorage. Otherwise
// the override is only captured when an onboarding gate renders (via the *Enabled
// helpers), which never happens on the login page, and the post-login redirect
// keeps only the pathname — so a preview link (e.g. a "for a child" landing page)
// that bounces a logged-out user through login would lose its flag. Called from
// the login page so the flag is captured before the login round-trip.
export const captureOnboardingPreviewFlags = (): void => {
  isPreviewEnabled(COMPANY_PREVIEW_SESSION_KEY);
  isPreviewEnabled(CHILD_PREVIEW_SESSION_KEY);
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
  {
    key: 'child',
    route: '/savings-fund/onboarding/child',
    enabled: isChildOnboardingEnabled(),
  },
];
