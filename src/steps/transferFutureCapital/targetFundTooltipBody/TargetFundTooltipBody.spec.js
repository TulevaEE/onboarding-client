import React from 'react';
import { shallow } from 'enzyme';

import TargetFundTooltipBody from './TargetFundTooltipBody';

describe('TargetFundTooltipBody', () => {
  let component;

  beforeEach(() => {
    component = shallow(<TargetFundTooltipBody targetFundIsin="AE0000000001" />);
  });

  it('when wrong isin passed - renders default no data message', () => {
    component.setProps({ targetFundIsin: 'someising'});

    const noDataMessage = () => component.find('div.target-fund-tooltip__no-data');
    const listItems = () => component.find('ul li');
    expect(noDataMessage()).toBeTruthy();
    expect(listItems().length).toBe(0);
  });

  it('renders component with correct fund info for advanced fund', () => {
    component.setProps({ targetFundIsin: 'AE0000000001'});

    const image = () => component.find('img.diagram');
    const listItems = () => component.find('ul li');
    expect(image().prop('src')).toBeTruthy();
    expect(listItems().length).toBe(5);
  });

  it('renders component with correct fund info for conservative fund', () => {
    component.setProps({ targetFundIsin: 'AE0000000002'});

    const image = () => component.find('img.diagram');
    const listItems = () => component.find('ul li');
    expect(image().prop('src')).toBeTruthy();
    expect(listItems().length).toBe(4);
  });
});
