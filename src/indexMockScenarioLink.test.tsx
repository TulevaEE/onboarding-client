import { screen } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

import { readMockModeConfiguration } from './components/common/requestMocker';
import { mockScenarios } from './components/common/requestMocker/scenarios';

jest.unmock('react-intl');

describe('The app opened from a shared mock scenario link', () => {
  const server = setupServer(
    rest.get('*', (request, response, context) => response(context.status(404))),
    rest.post('*', (request, response, context) => response(context.status(404))),
  );

  beforeAll(() => server.listen());
  afterAll(() => server.close());

  it('mocks the scenario, drops it from the address and counts the page view once', async () => {
    jest.resetModules();
    const pageViews: unknown[] = [];
    jest.doMock('./components/common/api', () => ({
      ...jest.requireActual('./components/common/api'),
      createTrackedEvent: (type: string, data: unknown) => {
        if (type === 'PAGE_VIEW') {
          pageViews.push(data);
        }
        return Promise.resolve();
      },
    }));
    jest.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    window.history.pushState({}, '', '/login?dev=SECOND_PILLAR_REJOIN_RATE_ONLY&language=en');
    document.body.innerHTML = '<div id="root"></div>';

    await import('./index');

    expect(
      await screen.findByRole('heading', { name: 'Log in to your account' }),
    ).toBeInTheDocument();
    expect(readMockModeConfiguration()).toEqual(mockScenarios.SECOND_PILLAR_REJOIN_RATE_ONLY);
    expect(window.location.search).toBe('?language=en');
    expect(pageViews).toEqual([{ path: '/login' }]);
  });
});
