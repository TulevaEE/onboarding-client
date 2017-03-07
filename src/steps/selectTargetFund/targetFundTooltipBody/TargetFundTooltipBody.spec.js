import React from 'react';
import { shallow } from 'enzyme';

import TargetFundTooltipBody from './TargetFundTooltipBody';

describe('InfoTooltip', () => {
  let component;

  beforeEach(() => {
    component = shallow(<TargetFundTooltipBody targetFundIsin="AE123232334" />);
  });

  it('renders component with correct fund info', () => {
    const image = () => component.find('img.diagram');
    const listItems = () => component.find('ul li');
    expect(image().prop('src')).toBeTruthy();
    expect(listItems().length).toBe(4);
  });
});
