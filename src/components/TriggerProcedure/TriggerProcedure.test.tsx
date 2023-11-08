import React from 'react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import { createMemoryHistory, History } from 'history';

import { TriggerProcedure } from './TriggerProcedure';
import { initializeConfiguration } from '../config/config';
import { createDefaultStore, renderWrapped } from '../../test/utils';

describe('When an external provider process is triggered', () => {
  const server = setupServer();
  let history: History;
  let consoleError: jest.SpyInstance<void, Parameters<typeof console.error>, any>;

  function initializeComponent(search: string) {
    history = createMemoryHistory();
    const store = createDefaultStore(history as any);

    Object.defineProperty(window, 'location', {
      value: { search },
      writable: true,
    });
    renderWrapped(<TriggerProcedure />, history as any, store);
  }

  const expectConsoledError = (match: RegExp) => {
    expect(consoleError).toBeCalledWith(expect.any(Error));
    expect(consoleError).toBeCalledWith(
      expect.objectContaining({
        message: expect.stringMatching(match),
      }),
    );
  };

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterEach(() => consoleError?.mockRestore());
  afterAll(() => server.close());

  beforeEach(() => {
    initializeConfiguration();
    server.use(
      rest.post('http://localhost/oauth/token', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            accessToken: '_accessToken_',
          }),
        );
      }),
    );
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('... and invalid data is provided', () => {
    test('no params', async () => {
      initializeComponent('');
      expect(await screen.findByText('unexpected error', { exact: false })).toBeInTheDocument();
      expectConsoledError(/invalid /i);
    });

    test('random provider', async () => {
      initializeComponent('?provider=_404_');
      expect(await screen.findByText('unexpected error', { exact: false })).toBeInTheDocument();
      expectConsoledError(/invalid provider.*_404_/i);
    });

    test('missing redirect uri', async () => {
      initializeComponent('?provider=testprovider1');

      expect(await screen.findByText('unexpected error', { exact: false })).toBeInTheDocument();
      expectConsoledError(/redirect uri/i);
    });

    test('missing procedure', async () => {
      initializeComponent(
        '?provider=testprovider1&redirectUri=testprovider1%3A%2F%2Ftuleva-flow%2Flink',
      );

      expect(await screen.findByText('unexpected error', { exact: false })).toBeInTheDocument();
      expectConsoledError(/procedure/i);
    });

    test('invalid procedure', async () => {
      initializeComponent(
        '?provider=testprovider1&redirectUri=testprovider1%3A%2F%2Ftuleva-flow%2Flink&procedure=_invalid_',
      );

      expect(await screen.findByText('unexpected error', { exact: false })).toBeInTheDocument();
      expectConsoledError(/invalid procedure.*_invalid_/i);
    });

    test('missing handoverToken', async () => {
      initializeComponent(
        '?provider=testprovider1&redirectUri=testprovider1%3A%2F%2Ftuleva-flow%2Flink&procedure=partner-3rd-pillar-flow',
      );

      expect(await screen.findByText('unexpected error', { exact: false })).toBeInTheDocument();
      expectConsoledError(/invalid handover/i);
    });
  });

  test('redirects if valid data is provided', async () => {
    initializeComponent(
      '?provider=testprovider1&redirectUri=testprovider1%3A%2F%2Ftuleva-flow%2Flink&procedure=partner-3rd-pillar-flow&handoverToken=_handover_token_',
    );
    expect(await screen.findByText('redirecting to', { exact: false })).toBeInTheDocument();
  });
});
