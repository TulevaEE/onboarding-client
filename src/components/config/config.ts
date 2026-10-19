import config from 'react-global-configuration';
import { restoreAuthenticationFromSession } from '../common/authenticationManager';

const BASE_CONFIG = {
  clientCredentialsAccessToken: undefined,
  language: 'et',
} as const;

const ENV_CONFIGS = {
  development: {
    ...BASE_CONFIG,
    applicationUrl: 'http://localhost:3000',
    clientCredentialsAccessToken: '6b338ba2-805c-4300-9341-b38bb4ad34a9',
    apiUrl: 'http://localhost:9000/v1',
  },
  production: {
    ...BASE_CONFIG,
    applicationUrl: 'https://pension.tuleva.ee',
    clientCredentialsAccessToken: '705e26c1-9316-47f2-94b8-a5c6b0dfb566',
    apiUrl: 'https://onboarding-service.tuleva.ee/v1',
  },
  staging: {
    ...BASE_CONFIG,
    applicationUrl: 'https://staging.tuleva.ee',
    clientCredentialsAccessToken: '6b338ba2-805c-4300-9341-b38bb4ad34a9',
    apiUrl: 'https://onboarding-service-staging.tuleva.ee/v1',
  },
  test: {
    ...BASE_CONFIG,
    applicationUrl: 'http://localhost',
    language: 'en',
    clientCredentialsAccessToken: undefined,
    apiUrl: 'http://localhost/v1',
  },
} as const;

const getEnv = () =>
  (process.env.REACT_APP_ENV || process.env.NODE_ENV) as keyof typeof ENV_CONFIGS;

export function initializeConfiguration() {
  const env = getEnv();
  const selectedConfig = ENV_CONFIGS[env] || BASE_CONFIG;
  config.set(selectedConfig, { freeze: false, assign: false });
  restoreAuthenticationFromSession();
}

export function updateLanguage(language: 'et' | 'en') {
  const env = getEnv();
  const selectedConfig = { ...ENV_CONFIGS[env], language };
  config.set(selectedConfig, { freeze: false, assign: true });
}
