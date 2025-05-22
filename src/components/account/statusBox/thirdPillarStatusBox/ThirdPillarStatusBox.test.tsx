import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { ThirdPillarStatusBox } from './ThirdPillarStatusBox';
import StatusBoxRow from '../statusBoxRow';
import { activeThirdPillar, completeThirdPillarConversion, highFeeThirdPillar } from '../fixtures';

jest.mock('../../../common/apiHooks', () => ({
  useFundPensionStatus: () => ({ fundPensions: [] }),
}));

/**
 * @deprecated Use AccountPageView.test.tsx
 */
describe('ThirdPillarStatusBox', () => {
  let component: ShallowWrapper;
  const props = {
    conversion: completeThirdPillarConversion.thirdPillar,
    loading: false,
    thirdPillarFunds: [activeThirdPillar],
    thirdPillarActive: true,
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-07-22T10:36:00Z'));
    component = shallow(<ThirdPillarStatusBox {...props} />);
  });

  it('renders the success flow', () => {
    expect(component).toMatchSnapshot();
  });

  it('does not show action when still loading', () => {
    component.setProps({ loading: true });
    expect(component.find(StatusBoxRow).prop('showAction')).toBeFalsy();
  });

  it('renders the "open third pillar" flow when user has no third pillar active', () => {
    component.setProps({ thirdPillarActive: false });
    expect(component).toMatchSnapshot();
  });

  it('renders the "pick tuleva" flow when user has some other fund manager', () => {
    component.setProps({
      conversion: {
        selectionPartial: false,
        selectionComplete: false,
        contribution: { yearToDate: 20, total: 20 },
        weightedAverageFee: 0.0049,
      },
    });
    expect(component).toMatchSnapshot();
  });

  it('renders the "pick tuleva" flow when partially converted with selection', () => {
    component.setProps({
      conversion: {
        selectionPartial: true,
        contribution: { yearToDate: 20, total: 20 },
        weightedAverageFee: 0.01,
      },
    });
    expect(component).toMatchSnapshot();
  });

  it('renders the "pick tuleva" flow when partially converted with transfer', () => {
    component.setProps({
      conversion: {
        transferPartial: true,
        contribution: { yearToDate: 20, total: 20 },
        weightedAverageFee: 0.0049,
      },
    });
    expect(component).toMatchSnapshot();
  });

  it('renders the "pick tuleva" flow when partially converted with transfer', () => {
    component.setProps({
      conversion: {
        transfersComplete: true,
        transfersPartial: true,
        selectionComplete: true,
        selectionPartial: true,
        contribution: { yearToDate: 20, total: 20 },
        weightedAverageFee: 0.01,
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
        contribution: { yearToDate: 20, total: 20 },
        weightedAverageFee: 0.01,
      },
    });
    expect(component).toMatchSnapshot();
  });

  it('renders the "payment incomplete" flow when no funds have ever been transferred', () => {
    component.setProps({
      conversion: {
        transfersComplete: true,
        transfersPartial: true,
        selectionComplete: true,
        selectionPartial: true,
        contribution: { yearToDate: 0, total: 0 },
        weightedAverageFee: 0.01,
      },
    });
    expect(component).toMatchSnapshot();
  });

  it('renders the success flow when funds have not transferred yet but its only january', () => {
    jest.setSystemTime(new Date('2023-01-24T00:00:00'));
    component.setProps({
      conversion: {
        transfersComplete: true,
        transfersPartial: true,
        selectionComplete: true,
        selectionPartial: true,
        contribution: { yearToDate: 0, total: 20 },
        weightedAverageFee: 0.01,
      },
    });
    expect(component).toMatchSnapshot();
  });

  it('renders the "payment incomplete" flow when funds have not transferred yet and date between feb-nov', () => {
    jest.setSystemTime(new Date('2023-02-24T00:00:00'));
    component.setProps({
      conversion: {
        transfersComplete: true,
        transfersPartial: true,
        selectionComplete: true,
        selectionPartial: true,
        contribution: { yearToDate: 0, total: 20 },
        weightedAverageFee: 0.01,
      },
    });
    expect(component).toMatchSnapshot();
  });

  it('renders the december flow when date in december', () => {
    jest.setSystemTime(new Date('2023-12-24T00:00:00'));
    component.setProps({
      conversion: {
        transfersComplete: true,
        transfersPartial: true,
        selectionComplete: true,
        selectionPartial: true,
        contribution: { yearToDate: 0, total: 20 },
        weightedAverageFee: 0.01,
      },
    });
    expect(component).toMatchSnapshot();
  });

  it('renders the "pick tuleva" flow with error when in high cost fund', () => {
    component.setProps({
      conversion: {
        transferPartial: true,
        contribution: { yearToDate: 20, total: 20 },
        weightedAverageFee: 0.01,
      },
      thirdPillarFunds: [highFeeThirdPillar],
    });
    expect(component).toMatchSnapshot();
  });

  it('shows high fee notice when balance is zero but active fund has high fee', () => {
    component.setProps({
      conversion: {
        selectionPartial: false,
        selectionComplete: false,
        transfersPartial: false,
        transfersComplete: false,
        contribution: { yearToDate: 0, total: 0 },
        weightedAverageFee: 0,
      },
      thirdPillarFunds: [highFeeThirdPillar],
    });
    expect(component).toMatchSnapshot();
  });
});
