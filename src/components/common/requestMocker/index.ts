import { History } from 'history';
import { MockModeConfiguration, MockModeEndpoint } from './types';
import { mockModeProfiles } from './profiles';
import { mockScenarios } from './scenarios';
import { withSessionStorage } from '../siteStorage';

const MOCK_MODE_CONFIGURATION_KEY_NAME = 'MOCK_MODE';

export const writeMockModeConfiguration = (config: Partial<MockModeConfiguration> | null) =>
  withSessionStorage((storage) => {
    if (config === null) {
      storage.removeItem(MOCK_MODE_CONFIGURATION_KEY_NAME);
    } else {
      storage.setItem(MOCK_MODE_CONFIGURATION_KEY_NAME, JSON.stringify(config));
    }
  }, undefined);

export const readMockModeConfiguration = () => {
  const config = withSessionStorage(
    (storage) => storage.getItem(MOCK_MODE_CONFIGURATION_KEY_NAME),
    null,
  );

  if (config === null) {
    return null;
  }

  return JSON.parse(config) as Partial<MockModeConfiguration>;
};

export const isMockModeEnabled = () => readMockModeConfiguration() !== null;

export const DEV_MODE_PARAM = 'dev';

export const applyMockScenarioFromLink = (history: History) => {
  const params = new URLSearchParams(history.location.search);
  const scenarioName = params.get(DEV_MODE_PARAM);
  if (!scenarioName) {
    return;
  }
  if (!Object.prototype.hasOwnProperty.call(mockScenarios, scenarioName)) {
    // eslint-disable-next-line no-console
    console.warn('No mock scenario named in the link:', scenarioName);
    return;
  }

  writeMockModeConfiguration(mockScenarios[scenarioName]);
  params.delete(DEV_MODE_PARAM);
  const otherParams = params.toString();
  history.replace({ ...history.location, search: otherParams ? `?${otherParams}` : '' });
};

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
