import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';
import { StatusBox } from './StatusBox';

describe('Status Box', () => {
  let component;
  let props;

  const to2ndPillarFlow = <Message>account.status.choice.join.tuleva.2</Message>;
  const pay3ndPillarFlow = <Message>account.status.choice.pay.tuleva.3</Message>;
  const toMemberFlow = <Message>account.status.choice.join.tuleva</Message>;

  beforeEach(() => {
    props = {
      conversion: { secondPillar: { contribution: {} }, thirdPillar: { contribution: {} } },
    };
    component = shallow(<StatusBox {...props} />);
  });

  it('renders status box title', () => {
    expect(component.contains(<Message>account.status.choices</Message>)).toBe(true);
  });

  it('renders 2nd pillar cta', () => {
    expect(component.contains(to2ndPillarFlow)).toBe(true);
  });

  const pillar2ComingSoon = <Message>account.status.choice.1970.coming.soon</Message>;

  it('wont render pillar II coming soon for 48 and below', () => {
    component.setProps({ age: 48 });
    expect(component.contains(to2ndPillarFlow)).toBe(true);
    expect(component.contains(pillar2ComingSoon)).toBe(false);
  });

  it('renders pillar II coming soon for 49 and over', () => {
    component.setProps({ age: 50 });
    expect(component.contains(pillar2ComingSoon)).toBe(false);
    expect(component.contains(to2ndPillarFlow)).toBe(true);
  });

  it('renders join Tuleva II pillar when II pillars not all in Tuleva', () => {
    expect(component.contains(to2ndPillarFlow)).toBe(true);
  });

  it('always renders pay Tuleva III pillar', () => {
    expect(component.contains(pay3ndPillarFlow)).toBe(true);
  });

  it('renders join Tuleva II pillar when II pillars some in Tuleva', () => {
    const secondPillarFunds = [
      { fund: { managerName: 'NotTuleva' }, activeFund: true, pillar: 2 },
      { fund: { managerName: 'Tuleva' }, activeFund: true, pillar: 2 },
    ];

    component.setProps({ secondPillarFunds });
    expect(component.contains(<Message>account.status.choice.join.tuleva.2</Message>)).toBe(true);
  });

  it('renders become Tuleva member when not member', () => {
    expect(component.contains(toMemberFlow)).toBe(true);
  });
});
