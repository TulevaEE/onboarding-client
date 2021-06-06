import { rest } from 'msw';
import { SetupServerApi } from 'msw/node';
import queryString from 'qs';

export function cancellationBackend(
  server: SetupServerApi,
): {
  cancellationCreated: boolean;
} {
  const backend = {
    cancellationCreated: false,
  };
  server.use(
    rest.post('http://localhost/v1/applications/123/cancellations', (req, res, ctx) => {
      if (req.headers.get('Authorization') !== 'Bearer mock token') {
        return res(ctx.status(401), ctx.json({ error: 'not authenticated correctly' }));
      }
      backend.cancellationCreated = true;
      return res(ctx.status(200), ctx.json({ mandateId: '1' }));
    }),
  );
  return backend;
}

export function mandateDownloadBackend(server: SetupServerApi) {
  const backend = {
    mandateDownloaded: false,
  };
  server.use(
    rest.get('http://localhost/v1/mandates/1/file', async (req, res, ctx) => {
      if (req.headers.get('Authorization') !== 'Bearer mock token') {
        return res(ctx.status(401), ctx.json({ error: 'not authenticated correctly' }));
      }
      backend.mandateDownloaded = true;
      return res(ctx.status(200), ctx.text('fake mandate'));
    }),
  );
  return backend;
}

export function mandatePreviewBackend(
  server: SetupServerApi,
): {
  previewDownloaded: boolean;
} {
  const backend = {
    previewDownloaded: false,
  };
  server.use(
    rest.get('http://localhost/v1/mandates/1/file/preview', async (req, res, ctx) => {
      if (req.headers.get('Authorization') !== 'Bearer mock token') {
        return res(ctx.status(401), ctx.json({ error: 'not authenticated correctly' }));
      }
      backend.previewDownloaded = true;
      return res(ctx.status(200), ctx.text('fake mandate preview'));
    }),
  );
  return backend;
}

export function smartIdSigningBackend(
  server: SetupServerApi,
  options: { challengeCode?: string } = {},
): {
  mandateSigned: boolean;
} {
  const backend = {
    mandateSigned: false,
  };
  server.use(
    rest.put('http://localhost/v1/mandates/1/signature/smartId', (req, res, ctx) => {
      if (req.headers.get('Authorization') !== 'Bearer mock token') {
        return res(ctx.status(401), ctx.json({ error: 'not authenticated correctly' }));
      }
      backend.mandateSigned = true;
      return res(ctx.status(200), ctx.json({ challengeCode: options.challengeCode || '9876' }));
    }),
    rest.get('http://localhost/v1/mandates/1/signature/smartId/status', (req, res, ctx) => {
      if (req.headers.get('Authorization') !== 'Bearer mock token') {
        return res(ctx.status(401), ctx.json({ error: 'not authenticated correctly' }));
      }
      return res(ctx.status(200), ctx.json({ statusCode: 'SIGNATURE' }));
    }),
  );
  return backend;
}

export function smartIdAuthenticationBackend(
  server: SetupServerApi,
  options: { challengeCode?: string; identityCode?: string } = {},
): { resolvePolling: () => void } {
  let pollingResolved = false;

  server.use(
    rest.post('http://localhost/authenticate', (req, res, ctx) => {
      if (req.body.type !== 'SMART_ID' || req.body.personalCode !== options.identityCode) {
        return res(ctx.status(401), ctx.json({ error: 'wrong method or id code' }));
      }
      return res(ctx.status(200), ctx.json({ challengeCode: options.challengeCode || '9876' }));
    }),
    rest.post('http://localhost/oauth/token', (req, res, ctx) => {
      const body = queryString.parse(req.body);
      if (
        body.grant_type !== 'smart_id' ||
        body.client_id !== 'onboarding-client' ||
        req.headers.get('Authorization') !==
          'Basic b25ib2FyZGluZy1jbGllbnQ6b25ib2FyZGluZy1jbGllbnQ='
      ) {
        return res(
          ctx.status(401),
          ctx.json({ error: 'wrong grant type, client id or basic auth' }),
        );
      }

      if (!pollingResolved) {
        return res(ctx.status(200), ctx.json({ error: 'AUTHENTICATION_NOT_COMPLETE' }));
      }

      return res(
        ctx.status(200),
        ctx.json({ access_token: 'mock token', refresh_token: 'mock refresh token' }),
      );
    }),
  );
  return {
    resolvePolling() {
      pollingResolved = true;
    },
  };
}
