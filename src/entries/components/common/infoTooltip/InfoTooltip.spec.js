import React from 'react';
import { shallow } from 'enzyme';

import InfoTooltip from './InfoTooltip';

describe('InfoTooltip', () => {
  let component;

  beforeEach(() => {
    component = shallow(
      <InfoTooltip name="test-tooltip">
        <div className="content">Hello world</div>
      </InfoTooltip>,
    );
  });

  it('renders children given to it', () => {
    const children = <div>I am passed as a child</div>;
    component.setProps({ children });
    expect(component.contains(children)).toBe(true);
  });

  it('renders info sign image with correct tooltip triggers', () => {
    const image = () => component.find('img.info-tooltip__image');
    expect(image().prop('data-for')).toBe('test-tooltip');
    expect(image().prop('data-tip')).toBeTruthy();
    expect(image().prop('alt')).toBe('Information');
    expect(image().prop('src')).toBeTruthy();
  });

  it('renders component with correctly included react tooltip component', () => {
    const reactTooltip = () => component.find('ReactTooltip');

    expect(reactTooltip().prop('id')).toBe('test-tooltip');
  });
});
