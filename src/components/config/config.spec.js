import config from 'react-global-configuration';
import { initializeConfiguration, updateLanguage } from './config';

describe('Config', () => {
  afterEach(() => {
    // do not carry configuration over from one test to another
    jest.resetModules();
    delete process.env.NODE_ENV;
    delete process.env.REACT_APP_ENV;
  });

  describe('initializeConfiguration', () => {
    it('sets development configuration when NODE_ENV is development', () => {
      process.env.NODE_ENV = 'development';
      initializeConfiguration();
      expect(config.get()).toEqual({
        applicationUrl: 'http://localhost:3000',
        clientCredentialsAccessToken: '6b338ba2-805c-4300-9341-b38bb4ad34a9',
        language: 'et',
        idCardUrl: 'https://alb-id.tuleva.ee',
      });
    });

    it('sets production configuration when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';
      initializeConfiguration();
      expect(config.get()).toEqual({
        applicationUrl: 'https://pension.tuleva.ee',
        clientCredentialsAccessToken: '705e26c1-9316-47f2-94b8-a5c6b0dfb566',
        language: 'et',
        idCardUrl: 'https://alb-id.tuleva.ee',
      });
    });

    it('sets staging configuration when REACT_APP_ENV is staging', () => {
      process.env.REACT_APP_ENV = 'staging';
      initializeConfiguration();
      expect(config.get()).toEqual({
        applicationUrl: 'https://staging.tuleva.ee',
        clientCredentialsAccessToken: '6b338ba2-805c-4300-9341-b38bb4ad34a9',
        language: 'et',
        idCardUrl: 'https://id-staging.tuleva.ee',
      });
    });

    it('sets staging configuration when REACT_APP_ENV is staging and NODE_ENV is production', () => {
      process.env.REACT_APP_ENV = 'staging';
      process.env.NODE_ENV = 'production'; // set automatically by create-react-app
      initializeConfiguration();
      expect(config.get()).toEqual({
        applicationUrl: 'https://staging.tuleva.ee',
        clientCredentialsAccessToken: '6b338ba2-805c-4300-9341-b38bb4ad34a9',
        language: 'et',
        idCardUrl: 'https://id-staging.tuleva.ee',
      });
    });

    it('sets test configuration when NODE_ENV is test', () => {
      process.env.NODE_ENV = 'test';
      initializeConfiguration();
      expect(config.get()).toEqual({
        applicationUrl: 'http://localhost',
        clientCredentialsAccessToken: undefined,
        language: 'en',
        idCardUrl: 'https://alb-id.tuleva.ee',
      });
    });
  });

  describe('updateLanguage', () => {
    it('updates language in development environment', () => {
      process.env.NODE_ENV = 'development';
      initializeConfiguration();
      updateLanguage('en');
      expect(config.get('language')).toBe('en');
    });

    it('updates language in production environment', () => {
      process.env.NODE_ENV = 'production';
      initializeConfiguration();
      updateLanguage('en');
      expect(config.get('language')).toBe('en');
    });

    it('updates language in staging environment', () => {
      process.env.REACT_APP_ENV = 'staging';
      process.env.NODE_ENV = 'production'; // set automatically by create-react-app
      initializeConfiguration();
      updateLanguage('en');
      expect(config.get('language')).toBe('en');
    });

    it('updates language in test environment', () => {
      process.env.NODE_ENV = 'test';
      initializeConfiguration();
      updateLanguage('en');
      expect(config.get('language')).toBe('en');
    });
  });
});
