import { DefaultRequestMultipartBody, rest } from 'msw';
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

export const mandateDownloadBackend = (server: SetupServerApi): void => {
  server.use(
    rest.get('http://localhost/v1/mandates/1/file', async (req, res, ctx) => {
      if (req.headers.get('Authorization') !== 'Bearer mock token') {
        return res(ctx.status(401), ctx.json({ error: 'not authenticated correctly' }));
      }
      return res(ctx.status(200), ctx.text('fake mandate'));
    }),
  );
};

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
      const body = req.body as DefaultRequestMultipartBody;
      if (
        body.type !== 'SMART_ID' ||
        (options.identityCode && body.personalCode !== options.identityCode)
      ) {
        return res(ctx.status(401), ctx.json({ error: 'wrong method or id code' }));
      }
      return res(ctx.status(200), ctx.json({ challengeCode: options.challengeCode || '9876' }));
    }),

    rest.post('http://localhost/oauth/token', (req, res, ctx) => {
      const body = queryString.parse(req.body as string);
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

export function mobileIdAuthenticationBackend(
  server: SetupServerApi,
  options: { challengeCode?: string; identityCode?: string; phoneNumber?: string } = {},
): { resolvePolling: () => void } {
  let pollingResolved = false;

  server.use(
    rest.post('http://localhost/authenticate', (req, res, ctx) => {
      const body = req.body as DefaultRequestMultipartBody;
      if (
        body.type !== 'MOBILE_ID' ||
        (options.identityCode && body.personalCode !== options.identityCode) ||
        (options.phoneNumber && body.phoneNumber !== options.phoneNumber)
      ) {
        return res(ctx.status(401), ctx.json({ error: 'wrong method, id code or number' }));
      }
      return res(ctx.status(200), ctx.json({ challengeCode: options.challengeCode || '9876' }));
    }),

    rest.post('http://localhost/oauth/token', (req, res, ctx) => {
      const body = queryString.parse(req.body as string);
      if (
        body.grant_type !== 'mobile_id' ||
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

export function idCardAuthenticationBackend(
  server: SetupServerApi,
): { authenticatedWithIdCard: boolean; acceptedCertificate: boolean } {
  const backend = { authenticatedWithIdCard: false, acceptedCertificate: false };
  server.use(
    rest.get('https://id.tuleva.ee', (req, res, ctx) => {
      backend.acceptedCertificate = true;
      return res(ctx.status(200), ctx.json({ success: true }));
    }),
    rest.post('https://id.tuleva.ee/idLogin', (req, res, ctx) => {
      backend.authenticatedWithIdCard = true;
      return res(ctx.status(200), ctx.json({ success: true }));
    }),
    rest.post('http://localhost/oauth/token', (req, res, ctx) => {
      const body = queryString.parse(req.body as string);
      if (
        body.grant_type !== 'id_card' ||
        body.client_id !== 'onboarding-client' ||
        req.headers.get('Authorization') !==
          'Basic b25ib2FyZGluZy1jbGllbnQ6b25ib2FyZGluZy1jbGllbnQ='
      ) {
        return res(
          ctx.status(401),
          ctx.json({ error: 'wrong grant type, client id or basic auth' }),
        );
      }

      return res(
        ctx.status(200),
        ctx.json({ access_token: 'mock token', refresh_token: 'mock refresh token' }),
      );
    }),
  );
  return backend;
}

export function userBackend(server: SetupServerApi): void {
  server.use(
    rest.get('http://localhost/v1/me', (req, res, ctx) => {
      return res(
        ctx.json({
          id: 123,
          personalCode: '39001011234',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phoneNumber: '55667788',
          memberNumber: 987,
          pensionAccountNumber: '9876543210',
          address: {
            street: 'Telliskivi 60a',
            districtCode: '0011',
            postalCode: '10101',
            countryCode: 'EE',
          },
          secondPillarActive: true,
          thirdPillarActive: true,
          age: 30,
        }),
      );
    }),
  );
}

export function userConversionBackend(server: SetupServerApi): void {
  server.use(
    rest.get('http://localhost/v1/me/conversion', (req, res, ctx) => {
      return res(
        ctx.json({
          secondPillar: {
            transfersComplete: true,
            selectionComplete: true,
            pendingWithdrawal: false,
            paymentComplete: null,
            contribution: { total: 12345.67, yearToDate: 111.11 },
            subtraction: { total: 0.0, yearToDate: 0.0 },
          },
          thirdPillar: {
            transfersComplete: true,
            selectionComplete: true,
            pendingWithdrawal: false,
            paymentComplete: true,
            contribution: { total: 9876.54, yearToDate: 999.99 },
            subtraction: { total: 0.0, yearToDate: 0.0 },
          },
        }),
      );
    }),
  );
}

export function amlChecksBackend(server: SetupServerApi): void {
  server.use(
    rest.get('http://localhost/v1/amlchecks', (req, res, ctx) => {
      return res(ctx.json([]));
    }),
  );
}

export function pensionAccountStatementBackend(server: SetupServerApi): void {
  server.use(
    rest.get('http://localhost/v1/pension-account-statement', (req, res, ctx) => {
      return res(
        ctx.json([
          {
            fund: {
              fundManager: { name: 'Tuleva' },
              isin: 'EE3600109435',
              name: 'Tuleva World Stocks Pension Fund',
              managementFeeRate: 0.0034,
              pillar: 2,
              ongoingChargesFigure: 0.0039,
              status: 'ACTIVE',
            },
            value: 15000.0,
            unavailableValue: 0,
            currency: 'EUR',
            pillar: 2,
            activeContributions: false,
            contributions: 12345.67,
            subtractions: 0,
            profit: 2654.33,
          },
          {
            fund: {
              fundManager: { name: 'Swedbank' },
              isin: 'EE3600019758',
              name: 'Swedbank Pension Fund K60',
              managementFeeRate: 0.0083,
              nav: 1.46726,
              volume: 1216511545.68352,
              pillar: 2,
              ongoingChargesFigure: 0.0065,
              status: 'ACTIVE',
              peopleCount: 131988,
              shortName: 'SWK50',
            },
            value: 100000,
            unavailableValue: 0,
            currency: 'EUR',
            pillar: 2,
            activeContributions: true,
            contributions: 112233.44,
            subtractions: 0,
            profit: -12233.44,
          },
          {
            fund: {
              fundManager: { name: 'Tuleva' },
              isin: 'EE3600001707',
              name: 'Tuleva III Samba Pensionifond',
              managementFeeRate: 0.003,
              pillar: 3,
              ongoingChargesFigure: 0.0043,
              status: 'ACTIVE',
            },
            value: 5699.36,
            unavailableValue: 0,
            currency: 'EUR',
            pillar: 3,
            activeContributions: true,
            contributions: 9876.54,
            subtractions: 0,
            profit: -1876.54,
          },
        ]),
      );
    }),
  );
}

export function fundsBackend(server: SetupServerApi): void {
  server.use(
    rest.get('http://localhost/v1/funds', (req, res, ctx) => {
      return res(
        ctx.json([
          {
            fundManager: { name: 'Tuleva' },
            isin: 'EE3600001707',
            name: 'Tuleva III Samba Pensionifond',
            managementFeeRate: 0.003,
            nav: 0.7813,
            volume: 47975601.7201,
            pillar: 3,
            ongoingChargesFigure: 0.0043,
            status: 'ACTIVE',
            peopleCount: 0,
            shortName: 'TUV100',
          },
          {
            fundManager: { name: 'Swedbank' },
            isin: 'EE3600019758',
            name: 'Swedbank Pension Fund K60',
            managementFeeRate: 0.0083,
            nav: 1.46726,
            volume: 1216511545.68352,
            pillar: 2,
            ongoingChargesFigure: 0.0065,
            status: 'ACTIVE',
            peopleCount: 131988,
            shortName: 'SWK50',
          },
          {
            fundManager: { name: 'Tuleva' },
            isin: 'EE3600109435',
            name: 'Tuleva World Stocks Pension Fund',
            managementFeeRate: 0.0034,
            nav: 0.87831,
            volume: 253616160.18811,
            pillar: 2,
            ongoingChargesFigure: 0.0039,
            status: 'ACTIVE',
            peopleCount: 24485,
            shortName: 'TUK75',
          },
        ]),
      );
    }),
  );
}

export function returnsBackend(server: SetupServerApi): void {
  server.use(
    rest.get('http://localhost/v1/returns', (req, res, ctx) => {
      return res(ctx.json({ from: '2018-06-06', returns: [] })); // TODO: Add returns
    }),
  );
}

export function userCapitalBackend(server: SetupServerApi): void {
  server.use(
    rest.get('http://localhost/v1/me/capital', (req, res, ctx) => {
      return res(
        ctx.json({
          membershipBonus: 1.23,
          capitalPayment: 1000.0,
          unvestedWorkCompensation: 0,
          workCompensation: 0,
          profit: -123.45,
        }),
      );
    }),
  );
}

export function applicationsBackend(server: SetupServerApi): void {
  server.use(
    rest.get('http://localhost/v1/applications', (req, res, ctx) => {
      return res(ctx.json([]));
    }),
  );
}

export function paymentLinkBackend(server: SetupServerApi): void {
  server.use(
    rest.get('http://localhost/v1/payments/link', (req, res, ctx) => {
      return res(
        ctx.json({
          url:
            `https://sandbox-payments.montonio.com?payment_token=example.jwt.token.with` +
            `.${req.url.searchParams.get('amount')}` +
            `.${req.url.searchParams.get('currency')}` +
            `.${req.url.searchParams.get('bank')}`,
        }),
      );
    }),
  );
}
