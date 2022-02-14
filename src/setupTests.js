import { configure } from 'enzyme'; // eslint-disable-line import/no-extraneous-dependencies
import Adapter from '@wojtekmaj/enzyme-adapter-react-17'; // eslint-disable-line import/no-extraneous-dependencies
import '@testing-library/jest-dom'; // eslint-disable-line import/no-extraneous-dependencies

jest.mock('react-intl', () => {
  const reactIntl = jest.requireActual('react-intl');
  const intl = reactIntl.createIntl({
    locale: 'en',
  });

  return {
    ...reactIntl,
    useIntl: () => intl,
  };
});

jest.mock('mixpanel-browser', () => ({
  identify: jest.fn(),
  track: jest.fn(),
  register: jest.fn(),
  people: { set: jest.fn() },
}));

configure({ adapter: new Adapter() });
