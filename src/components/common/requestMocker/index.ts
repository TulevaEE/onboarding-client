import { MockModeConfiguration, MockModeEndpoint } from './types';
import { mockModeProfiles } from './profiles';

const MOCK_MODE_CONFIGURATION_KEY_NAME = 'MOCK_MODE';

export const writeMockModeConfiguration = (config: MockModeConfiguration | null) => {
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

  return JSON.parse(config) as MockModeConfiguration;
};

export const isMockModeEnabled = () => readMockModeConfiguration() !== null;

export async function mockRequestInMockMode<TResponse = unknown>(
  response: Promise<TResponse>,
  endpointName: MockModeEndpoint,
) {
  const config = readMockModeConfiguration();

  if (config === null) {
    return response;
  }

  const selectedProfile = config[endpointName];

  if (selectedProfile === null) {
    return response;
  }

  console.warn('Mocking request to ', endpointName, ' with profile', selectedProfile);

  return mockModeProfiles[endpointName][selectedProfile] as TResponse;
}
