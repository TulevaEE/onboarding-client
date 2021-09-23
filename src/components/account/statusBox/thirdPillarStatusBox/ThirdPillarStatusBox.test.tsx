import React from 'react';
import { shallow } from 'enzyme';
import { ThirdPillarStatusBox } from './ThirdPillarStatusBox';
import { StatusBoxRow } from '../statusBoxRow/StatusBoxRow';
import { activeThirdPillar, completeThirdPillarconversion } from '../fixtures';

describe('ThirdPillarStatusBox', () => {
  const props = {
    conversion: completeThirdPillarconversion,
    loading: false,
    thirdPillarFunds: [activeThirdPillar],
  };
  const component = shallow(<ThirdPillarStatusBox {...props} />);

  it('renders the success flow', () => {
    expect(component).toMatchSnapshot();
  });

  it('does not show action when still loading', () => {
    component.setProps({ loading: true });
    expect(component.find(StatusBoxRow).prop('showAction')).toBeFalsy();
  });

  it('does not render status box OK when not fully converted', () => {
    component.setProps({ conversion: { thirdPillar: { selectionComplete: false } } });
    expect(component.find(StatusBoxRow).prop('ok')).toBeFalsy();
  });
});
