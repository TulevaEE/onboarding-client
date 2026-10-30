import { configure } from 'enzyme'; // eslint-disable-line import/no-extraneous-dependencies
import Adapter from '@wojtekmaj/enzyme-adapter-react-17'; // eslint-disable-line import/no-extraneous-dependencies
import '@testing-library/jest-dom'; // eslint-disable-line import/no-extraneous-dependencies
import { configure as configureTestingLibrary } from '@testing-library/react'; // eslint-disable-line import/no-extraneous-dependencies
import mockTranslations from './components/translations';

// Default 5s/1s limits flake on the slowest suites when parallel workers saturate all cores
jest.setTimeout(15000);
configureTestingLibrary({ asyncUtilTimeout: 3000 });

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

const DAY_FUTURE_ME_VALUES_ARE_FOR = Date.parse('2026-10-15T12:00:00Z');

const pinTodayWithoutFakeTimers = (today) => {
  const RealDate = Date;
  global.Date = class extends RealDate {
    constructor(...args) {
      super(...(args.length > 0 ? args : [today]));
    }

    static now() {
      return today;
    }
  };
};

if (expect.getState().testPath?.includes('/components/futureMe/')) {
  pinTodayWithoutFakeTimers(DAY_FUTURE_ME_VALUES_ARE_FOR);
}
