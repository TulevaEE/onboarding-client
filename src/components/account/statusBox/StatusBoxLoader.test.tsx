import React from 'react';
import { shallow } from 'enzyme';
import { StatusBoxLoader } from './StatusBoxLoader';

describe('StatusBoxLoader', () => {
  const component = shallow(<StatusBoxLoader />);

  it('renders correctly', () => {
    expect(component).toMatchSnapshot();
  });
});
