import { configure } from 'enzyme'; // eslint-disable-line import/no-extraneous-dependencies
// import Adapter from '@wojtekmaj/enzyme-adapter-react-17'; // eslint-disable-line import/no-extraneous-dependencies
import Adapter from '@cfaester/enzyme-adapter-react-18';
import '@testing-library/jest-dom'; // eslint-disable-line import/no-extraneous-dependencies
import mockTranslations from './components/translations';

// Note: Enzyme does not have an official React 18 adapter.
// Tests using Enzyme need to be migrated to React Testing Library.
// configure({ adapter: new Adapter() });

jest.mock('react-intl', () => {
  const reactIntl = jest.requireActual('react-intl');
  const intl = reactIntl.createIntl({
    locale: 'en',
    messages: mockTranslations.en,
    onError: (err) => {
      if (err.code === 'MISSING_TRANSLATION') {
        return;
      }
      throw err;
    },
  });

  return {
    ...reactIntl,
    useIntl: () => intl,
  };
});

window.matchMedia = () => ({
  matches: false,
  addListener: jest.fn(),
  removeListener: jest.fn(),
});

configure({ adapter: new Adapter() });
