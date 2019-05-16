import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import { ConfirmThirdPillarMandate } from './ConfirmThirdPillarMandate';

describe('ConfirmThirdPillarMandate', () => {
  let component;
  beforeEach(() => {
    component = shallow(<ConfirmThirdPillarMandate />);
  });

  it('has intro only when future contributions fund is selected', () => {
    const hasIntro = () => component.contains(<Message>confirmThirdPillarMandate.intro</Message>);

    expect(hasIntro()).toBe(false);
    component.setProps({ selectedFutureContributionsFund: { isin: 'EE123' } });
    expect(hasIntro()).toBe(true);
  });

  it('has future contributions fund name and message only when future contributions fund is selected', () => {
    const hasMessage = () =>
      component.contains(<Message>confirmThirdPillarMandate.contribution</Message>);
    const hasFundName = () => component.contains(<b className="highlight">A pension fund</b>);

    expect(hasMessage()).toBe(false);
    expect(hasFundName()).toBe(false);
    component.setProps({
      selectedFutureContributionsFund: { isin: 'EE123', name: 'A pension fund' },
    });
    expect(hasMessage()).toBe(true);
    expect(hasFundName()).toBe(true);
  });
});
