import { screen } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

import { blockSiteStorage } from './test/siteStorage';

jest.unmock('react-intl');

describe('The app on a browser that blocks site storage', () => {
  const server = setupServer(
    rest.get('*', (request, response, context) => response(context.status(404))),
    rest.post('*', (request, response, context) => response(context.status(404))),
  );
  let unblockSiteStorage: () => void;

  beforeAll(() => {
    server.listen();
    unblockSiteStorage = blockSiteStorage();
  });

  afterAll(() => {
    unblockSiteStorage();
    server.close();
  });

  it('opens the login page and asks to allow cookies', async () => {
    jest.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    window.history.pushState({}, '', '/login?language=en');
    document.body.innerHTML = '<div id="root"></div>';

    await import('./index');

    expect(
      await screen.findByRole('heading', { name: 'Log in to your account' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Allow cookies for this site to log in.')).toBeInTheDocument();
  });
});
