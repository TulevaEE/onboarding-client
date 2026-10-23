import { mockScenarios } from './scenarios';
import { getProfileOptions } from './profiles';
import { MockModeEndpoint } from './types';

const scenarioProfiles = Object.entries(mockScenarios).flatMap(([scenarioName, scenario]) =>
  Object.entries(scenario).map(([endpoint, profile]) => [scenarioName, endpoint, profile]),
);

describe('mock scenarios', () => {
  it.each(scenarioProfiles)('%s mocks %s with a profile that exists', (_, endpoint, profile) => {
    expect(getProfileOptions(endpoint as MockModeEndpoint)).toContain(profile);
  });
});
