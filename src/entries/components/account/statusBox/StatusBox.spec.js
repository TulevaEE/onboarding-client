import React from 'react';
import { mount } from 'enzyme';
import { Message } from 'retranslate';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import StatusBox from './StatusBox';
import { mockStore } from '../../../../test/utils';

describe('Status Box', () => {
  let component;
  let props;

  beforeEach(() => {
    props = { currentBalanceFunds: [] };
    component = mountWithProvider(<StatusBox {...props} />);
  });

  it('renders status box title', () => {
    expect(component.contains(<Message>account.status.choices</Message>)).toBe(true);
  });

  it('renders pillar II  title', () => {
    expect(component.contains(<Message>account.status.choice.pillar.second</Message>)).toBe(true);
  });

  it('renders pillar III  title', () => {
    expect(component.contains(<Message>account.status.choice.pillar.third</Message>)).toBe(true);
  });

  it('renders Tuleva  title', () => {
    expect(component.contains(<Message>account.status.choice.tuleva</Message>)).toBe(true);
  });

  function mountWithProvider(renderComponent) {
    return mount(
      <Provider store={mockStore({ login: {}, account: {} })}>
        <BrowserRouter>{renderComponent}</BrowserRouter>
      </Provider>,
    );
  }
});
