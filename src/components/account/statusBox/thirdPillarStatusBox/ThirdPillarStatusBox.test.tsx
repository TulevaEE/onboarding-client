import React from 'react';
import { shallow } from 'enzyme';
import { ThirdPillarStatusBox } from './ThirdPillarStatusBox';
import { StatusBoxRow } from '../statusBoxRow/StatusBoxRow';
import { activeThirdPillar, completeThirdPillarconversion } from '../fixtures';

describe('ThirdPillarStatusBox', () => {
  const props = {
    conversion: completeThirdPillarconversion,
    loading: false,
    sourceFunds: [activeThirdPillar],
    pillarActive: true,
  };
  const component = shallow(<ThirdPillarStatusBox {...props} />);

  it('renders the success flow', () => {
    expect(component).toMatchSnapshot();
  });

  it('does not show action when still loading', () => {
    component.setProps({ loading: true });
    expect(component.find(StatusBoxRow).prop('showAction')).toBeFalsy();
  });

  it('renders the "open third pillar" flow when user has no pillar active', () => {
    component.setProps({ pillarActive: false });
    expect(component).toMatchSnapshot();
  });

  it('renders the "pick tuleva" flow when user has some other fund manager', () => {
    component.setProps({ conversion: { thirdPillar: { selectionComplete: false } } });
    expect(component).toMatchSnapshot();
  });
});
