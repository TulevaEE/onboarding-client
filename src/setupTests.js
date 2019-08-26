import { configure } from 'enzyme'; // eslint-disable-line import/no-extraneous-dependencies
import Adapter from 'enzyme-adapter-react-16'; // eslint-disable-line import/no-extraneous-dependencies

// necessary due to https://github.com/facebook/create-react-app/issues/7539
jest.mock('retranslate', () => jest.requireActual('../__mocks__/retranslate'));

configure({ adapter: new Adapter() });
