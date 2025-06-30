import { MockModeConfiguration, MockModeEndpoint } from './types';
import { mockModeProfiles } from './profiles';

const MOCK_MODE_CONFIGURATION_KEY_NAME = 'MOCK_MODE';

export const writeMockModeConfiguration = (config: Partial<MockModeConfiguration> | null) => {
  if (config === null) {
    sessionStorage.removeItem(MOCK_MODE_CONFIGURATION_KEY_NAME);
  } else {
    sessionStorage.setItem(MOCK_MODE_CONFIGURATION_KEY_NAME, JSON.stringify(config));
  }
};

export const readMockModeConfiguration = () => {
  const config = sessionStorage.getItem(MOCK_MODE_CONFIGURATION_KEY_NAME);

  if (config === null) {
    return null;
  }

  return JSON.parse(config) as Partial<MockModeConfiguration>;
};

export const isMockModeEnabled = () => readMockModeConfiguration() !== null;

export async function mockRequestInMockMode<TResponse = unknown>(
  fetcher: () => Promise<TResponse>,
  endpointName: MockModeEndpoint,
) {
  const config = readMockModeConfiguration();

  if (config === null || !config) {
    return fetcher();
  }

  const selectedProfile = config[endpointName];

  if (!selectedProfile) {
    return fetcher();
  }

  // eslint-disable-next-line no-console
  console.warn('Mocking request to', endpointName, 'with profile', selectedProfile);

  return mockModeProfiles[endpointName][selectedProfile] as TResponse;
}
