import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { ThirdPillarStatusBox } from './ThirdPillarStatusBox';
import StatusBoxRow from '../statusBoxRow';
import { activeThirdPillar, completeThirdPillarconversion } from '../fixtures';

describe('ThirdPillarStatusBox', () => {
  let component: ShallowWrapper;
  const props = {
    conversion: completeThirdPillarconversion,
    loading: false,
    sourceFunds: [activeThirdPillar],
    pillarActive: true,
  };

  beforeEach(() => {
    component = shallow(<ThirdPillarStatusBox {...props} />);
  });

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
    component.setProps({
      conversion: { thirdPillar: { selectionComplete: false, contribution: { yearToDate: 20 } } },
    });
    expect(component).toMatchSnapshot();
  });

  it('renders the "transfer incomplete" flow when user has several funds', () => {
    component.setProps({
      conversion: {
        thirdPillar: {
          transfersComplete: false,
          selectionComplete: true,
          contribution: { yearToDate: 20 },
        },
      },
    });
    expect(component).toMatchSnapshot();
  });

  it('renders the "payment incomplete" flow when funds have not transferred yet', () => {
    component.setProps({
      conversion: {
        thirdPillar: {
          paymentComplete: false,
          transfersComplete: true,
          selectionComplete: true,
          contribution: { yearToDate: 20 },
        },
      },
    });
    expect(component).toMatchSnapshot();
  });
});
