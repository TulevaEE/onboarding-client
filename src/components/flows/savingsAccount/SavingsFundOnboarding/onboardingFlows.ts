import { LocationDescriptorObject } from 'history';
import { PendingOnboarding } from '../../../common/apiModels';

export const CHILD_ONBOARDING_ROUTE = '/savings-fund/onboarding/child';

// Router state, never the URL: the minor's code must stay out of history and logs.
export const childOnboardingLocation = (
  childPersonalCode: string,
): LocationDescriptorObject<{ childPersonalCode: string }> => ({
  pathname: CHILD_ONBOARDING_ROUTE,
  state: { childPersonalCode },
});

export const pendingChildOnboardings = (
  pendingOnboardings: PendingOnboarding[],
): PendingOnboarding[] => pendingOnboardings.filter(({ type }) => type === 'PERSON');

export type OnboardingFlowOption = {
  key: 'person' | 'company' | 'child';
  route: string;
};

export const getOnboardingFlowOptions = (): OnboardingFlowOption[] => [
  { key: 'person', route: '/savings-fund/onboarding/person' },
  { key: 'company', route: '/savings-fund/onboarding/company' },
  { key: 'child', route: CHILD_ONBOARDING_ROUTE },
];

const FLOW_SELECTION_STORAGE_KEY = 'savingsFundOnboardingFlowSelection';

export const rememberOnboardingFlowSelection = (key: OnboardingFlowOption['key']): void => {
  sessionStorage.setItem(FLOW_SELECTION_STORAGE_KEY, key);
};

export const getRememberedOnboardingFlowSelection = (): OnboardingFlowOption['key'] | null => {
  const remembered = sessionStorage.getItem(FLOW_SELECTION_STORAGE_KEY);
  const option = getOnboardingFlowOptions().find(({ key }) => key === remembered);
  return option?.key ?? null;
};
