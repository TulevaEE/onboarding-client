import React from 'react';
import { mount } from 'enzyme';
import { Message } from 'retranslate';
import { Provider } from 'react-redux';
import { BrowserRouter, Link } from 'react-router-dom';
import StatusBox from './StatusBox';
import { mockStore } from '../../../../test/utils';

describe('Status Box', () => {
  let component;
  let props;

  const to2ndPillarFlow = (
    <Link to="/2nd-pillar-flow">
      <Message>account.status.choice.join.tuleva.2</Message>
    </Link>
  );
  const toMemberFlow = <Message>account.status.choice.join.tuleva</Message>;

  beforeEach(() => {
    props = { currentBalanceFunds: [] };
    component = mountWithProvider(<StatusBox {...props} />);
  });

  it('renders status box title', () => {
    expect(component.contains(<Message>account.status.choices</Message>)).toBe(true);
  });

  it('renders pillar II  title', () => {
    expect(component.contains(to2ndPillarFlow)).toBe(true);
  });

  const pillar2ComingSoon = <Message>account.status.choice.1970.coming.soon</Message>;

  it('wont render pillar II  coming soon for 54 and below', () => {
    component.setProps({ age: 54 });
    expect(component.contains(pillar2ComingSoon)).toBe(false);
  });

  it('renders pillar II  coming soon for 55 and over', () => {
    component.setProps({ age: 56 });
    expect(component.contains(pillar2ComingSoon)).toBe(true);
  });

  it('renders Tuleva  title', () => {
    expect(component.contains(<Message>account.status.choice.tuleva</Message>)).toBe(true);
  });

  it('renders join Tuleva II pillar when II pillars not all in Tuleva', () => {
    expect(component.contains(to2ndPillarFlow)).toBe(true);
  });

  it('renders join Tuleva II pillar when II pillars some in Tuleva', () => {
    const currentBalanceFunds = [
      { fund: { managerName: 'NotTuleva' }, activeFund: true, pillar: 2 },
      { fund: { managerName: 'Tuleva' }, activeFund: true, pillar: 2 },
    ];

    component.setProps({ currentBalanceFunds });
    expect(component.contains(<Message>account.status.choice.join.tuleva.2</Message>)).toBe(true);
  });

  it('renders become Tuleva member when not member', () => {
    expect(component.contains(toMemberFlow)).toBe(true);
  });

  function mountWithProvider(renderComponent) {
    return mount(
      <Provider store={mockStore({ login: {}, account: {} })}>
        <BrowserRouter>{renderComponent}</BrowserRouter>
      </Provider>,
    );
  }
});
