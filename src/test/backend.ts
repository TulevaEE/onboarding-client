import { rest } from 'msw';
import { SetupServerApi } from 'msw/node';

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
      return res(ctx.status(200), ctx.json({ challengeCode: '9876' }));
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
