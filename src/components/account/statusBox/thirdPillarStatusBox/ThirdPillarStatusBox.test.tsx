import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { ThirdPillarStatusBox } from './ThirdPillarStatusBox';
import StatusBoxRow from '../statusBoxRow';
import { activeThirdPillar, completeThirdPillarConversion } from '../fixtures';

describe('ThirdPillarStatusBox', () => {
  let component: ShallowWrapper;
  const props = {
    conversion: completeThirdPillarConversion.thirdPillar,
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
      conversion: {
        selectionPartial: false,
        selectionComplete: false,
        contribution: { yearToDate: 20 },
      },
    });
    expect(component).toMatchSnapshot();
  });

  it('renders the "pick tuleva" flow when partially converted with selection', () => {
    component.setProps({
      conversion: {
        selectionPartial: true,
        contribution: { yearToDate: 20 },
      },
    });
    expect(component).toMatchSnapshot();
  });

  it('renders the "pick tuleva" flow when partially converted with transfer', () => {
    component.setProps({
      conversion: {
        transferPartial: true,
        contribution: { yearToDate: 20 },
      },
    });
    expect(component).toMatchSnapshot();
  });

  it('renders the "transfer incomplete" flow when user has several funds', () => {
    component.setProps({
      conversion: {
        transfersComplete: false,
        transfersPartial: false,
        selectionComplete: true,
        selectionPartial: true,
        contribution: { yearToDate: 20 },
      },
    });
    expect(component).toMatchSnapshot();
  });

  it('renders the "payment incomplete" flow when funds have not transferred yet', () => {
    component.setProps({
      conversion: {
        transfersComplete: true,
        transfersPartial: true,
        selectionComplete: true,
        selectionPartial: true,
        contribution: { total: 0, yearToDate: 0 },
      },
    });
    expect(component).toMatchSnapshot();
  });
});
