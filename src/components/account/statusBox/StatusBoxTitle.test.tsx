import React from 'react';
import { shallow } from 'enzyme';
import { StatusBoxTitle } from './StatusBoxTitle';

describe('StatusBoxLoader', () => {
  const component = shallow(<StatusBoxTitle />);

  it('renders correctly', () => {
    expect(component).toMatchSnapshot();
  });
});
