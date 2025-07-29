import { DefaultRequestMultipartBody, rest, RestRequest } from 'msw';
import { SetupServerApi } from 'msw/node';
import queryString from 'qs';
import { isEqual } from 'lodash';
import moment from 'moment';
import {
  Application,
  CapitalEvent,
  CapitalRow,
  Conversion,
  FundBalance,
  MemberCapitalListing,
  User,
  MemberLookup,
} from '../components/common/apiModels/index';
import { anAuthenticationManager } from '../components/common/authenticationManagerFixture';
import { ReturnsResponse } from '../components/account/ComparisonCalculator/api';
import {
  CreateMandateBatchDto,
  FundPensionStatus,
  MandateDto,
  WithdrawalsEligibility,
} from '../components/common/apiModels/withdrawals';
import {
  authErrorResponse,
  cancellationResponse,
  capitalRowsResponse,
  getMobileSignatureResponse,
  getMobileSignatureStatusResponse,
  mandateDeadlinesResponse,
  mockFunds,
  mockSecondPillarConversion,
  mockThirdPillarConversion,
  mockUser,
  secondPillarPaymentRateChangeResponse,
} from './backend-responses';
import {
  CapitalTransferContract,
  UpdateCapitalTransferContractDto,
} from '../components/common/apiModels/capital-transfer';

export function cancellationBackend(server: SetupServerApi): {
  cancellationCreated: boolean;
} {
  const backend = {
    cancellationCreated: false,
  };
  server.use(
    rest.post('http://localhost/v1/applications/123/cancellations', (req, res, ctx) => {
      if (req.headers.get('Authorization') !== 'Bearer an access token') {
        return res(ctx.status(401), ctx.json(authErrorResponse));
      }
      backend.cancellationCreated = true;
      return res(ctx.status(200), ctx.json(cancellationResponse));
    }),
  );
  return backend;
}

export const mandateDownloadBackend = (server: SetupServerApi): void => {
  server.use(
    rest.get('http://localhost/v1/mandates/1/file', async (req, res, ctx) => {
      if (req.headers.get('Authorization') !== 'Bearer an access token') {
        return res(ctx.status(401), ctx.json(authErrorResponse));
      }
      return res(ctx.status(200), ctx.text('fake mandate'));
    }),
  );
};

export function mandatePreviewBackend(server: SetupServerApi): {
  previewDownloaded: boolean;
} {
  const backend = {
    previewDownloaded: false,
  };
  server.use(
    rest.get('http://localhost/v1/mandates/1/file/preview', async (req, res, ctx) => {
      if (req.headers.get('Authorization') !== 'Bearer an access token') {
        return res(ctx.status(401), ctx.json(authErrorResponse));
      }
      backend.previewDownloaded = true;
      return res(ctx.status(200), ctx.text('fake mandate preview'));
    }),
  );
  return backend;
}

export const mandateBatchBackend = (server: SetupServerApi): void => {
  server.use(
    rest.post(
      'http://localhost/v1/mandate-batches',
      async (req: RestRequest<CreateMandateBatchDto>, res, ctx) => {
        if (req.headers.get('Authorization') !== 'Bearer an access token') {
          return res(ctx.status(401), ctx.json(authErrorResponse));
        }

        const mandates: MandateDto[] = req.body.mandates.map((mandate, idx) => ({
          ...mandate,
          id: idx + 1,
          createdDate: '2024-01-01',
        }));

        return res(
          ctx.status(200),
          ctx.json({
            id: 1,
            mandates,
          }),
        );
      },
    ),
  );
};

export function smartIdMandateSigningBackend(
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
      if (req.headers.get('Authorization') !== 'Bearer an access token') {
        return res(ctx.status(401), ctx.json(authErrorResponse));
      }
      backend.mandateSigned = true;
      return res(ctx.status(200), ctx.json(getMobileSignatureResponse(options.challengeCode)));
    }),
    rest.get('http://localhost/v1/mandates/1/signature/smartId/status', (req, res, ctx) => {
      if (req.headers.get('Authorization') !== 'Bearer an access token') {
        return res(ctx.status(401), ctx.json(authErrorResponse));
      }
      return res(ctx.status(200), ctx.json(getMobileSignatureStatusResponse('SIGNATURE')));
    }),
  );
  return backend;
}

export function smartIdMandateBatchSigningBackend(
  server: SetupServerApi,
  options: { challengeCode?: string } = {},
): {
  signed: boolean;
} {
  const backend = {
    signed: false,
    statusCount: 0,
  };
  server.use(
    rest.put('http://localhost/v1/mandate-batches/1/signature/smart-id', (req, res, ctx) => {
      if (req.headers.get('Authorization') !== 'Bearer an access token') {
        return res(ctx.status(401), ctx.json(authErrorResponse));
      }
      backend.signed = true;
      return res(ctx.status(200), ctx.json(getMobileSignatureResponse(null)));
    }),
    rest.get('http://localhost/v1/mandate-batches/1/signature/smart-id/status', (req, res, ctx) => {
      if (req.headers.get('Authorization') !== 'Bearer an access token') {
        return res(ctx.status(401), ctx.json(authErrorResponse));
      }

      backend.statusCount += 1;

      if (backend.statusCount >= 2) {
        return res(ctx.status(200), ctx.json(getMobileSignatureStatusResponse('SIGNATURE')));
      }

      return res(
        ctx.status(200),
        ctx.json(
          getMobileSignatureStatusResponse('OUTSTANDING_TRANSACTION', options.challengeCode),
        ),
      );
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
      return res(ctx.status(200), ctx.json(getMobileSignatureResponse(options.challengeCode)));
    }),

    rest.post('http://localhost/oauth/token', (req, res, ctx) => {
      const body = queryString.parse(req.body as string);
      if (
        body.grant_type !== 'SMART_ID' ||
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
        ctx.json({ access_token: 'an access token', refresh_token: 'mock refresh token' }),
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
      return res(ctx.status(200), ctx.json(getMobileSignatureResponse(options.challengeCode)));
    }),

    rest.post('http://localhost/oauth/token', (req, res, ctx) => {
      const body = queryString.parse(req.body as string);
      if (
        body.grant_type !== 'MOBILE_ID' ||
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
        ctx.json({ access_token: 'an access token', refresh_token: 'mock refresh token' }),
      );
    }),
  );
  return {
    resolvePolling() {
      pollingResolved = true;
    },
  };
}

export function idCardAuthenticationBackend(server: SetupServerApi): {
  authenticatedWithIdCard: boolean;
  acceptedCertificate: boolean;
} {
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
        body.grant_type !== 'ID_CARD' ||
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
        ctx.json({ access_token: 'an access token', refresh_token: 'mock refresh token' }),
      );
    }),
  );
  return backend;
}

export function partnerAuthenticationBackend(server: SetupServerApi): void {
  server.use(
    rest.post('http://localhost/oauth/token', (req, res, ctx) =>
      res(
        ctx.status(200),
        ctx.json({
          access_token: anAuthenticationManager().accessToken,
          refresh_token: anAuthenticationManager().refreshToken,
        }),
      ),
    ),
  );
}

export function userBackend(
  server: SetupServerApi,
  overrides: Partial<User> = {},
  expectedUser: Partial<User> = mockUser,
): void {
  server.use(
    rest.get('http://localhost/v1/me', (req, res, ctx) =>
      res(
        ctx.json({
          ...mockUser,
          ...overrides,
        }),
      ),
    ),
    rest.patch('http://localhost/v1/me', (req, res, ctx) => {
      const user = {
        ...mockUser,
        ...overrides,
        ...expectedUser,
      };

      if (!isEqual(expectedUser, req.body)) {
        return res(ctx.status(500), ctx.json({ errors: [] }));
      }

      return res(ctx.json({ ...user, contactDetailsLastUpdateDate: moment().toISOString() }));
    }),
  );
}

export function userConversionBackend(
  server: SetupServerApi,
  secondPillarOverrides: Partial<Conversion> = {},
  thirdPillarOverrides: Partial<Conversion> = {},
): void {
  server.use(
    rest.get('http://localhost/v1/me/conversion', (req, res, ctx) =>
      res(
        ctx.json({
          secondPillar: {
            ...mockSecondPillarConversion,
            ...secondPillarOverrides,
          },
          thirdPillar: {
            ...mockThirdPillarConversion,
            ...thirdPillarOverrides,
          },
        }),
      ),
    ),
  );
}

export function amlChecksBackend(server: SetupServerApi): void {
  server.use(rest.get('http://localhost/v1/amlchecks', (req, res, ctx) => res(ctx.json([]))));
  server.use(
    rest.post('http://localhost/v1/amlchecks', (req, res, ctx) => {
      if (req.headers.get('Authorization') !== 'Bearer an access token') {
        return res(ctx.status(401), ctx.json(authErrorResponse));
      }
      return res(ctx.status(200), ctx.json(req.body));
    }),
  );
}

export function pensionAccountStatementBackend(
  server: SetupServerApi,
  fundBalances: FundBalance[] | null = null,
): void {
  server.use(
    rest.get('http://localhost/v1/pension-account-statement', (req, res, ctx) => {
      const defaultFundBalances: FundBalance[] = [
        {
          fund: {
            fundManager: { name: 'Tuleva' },
            isin: 'EE3600109435',
            name: 'Tuleva World Stocks Pension Fund',
            managementFeeRate: 0.0034,
            pillar: 2,
            ongoingChargesFigure: 0.0039,
            status: 'ACTIVE',
            inceptionDate: '2017-01-01',
            nav: 0.87831,
          },
          value: 15000.0,
          unavailableValue: 0,
          currency: 'EUR',
          activeContributions: false,
          contributions: 12345.67,
          subtractions: 0,
          profit: 2654.33,
          units: 15000 / 0.87831, // cross-referenced from fund backend, those values are actually used
        },
        {
          fund: {
            fundManager: { name: 'Swedbank' },
            isin: 'EE3600019758',
            name: 'Swedbank Pension Fund K60',
            managementFeeRate: 0.0083,
            pillar: 2,
            ongoingChargesFigure: 0.0065,
            status: 'ACTIVE',
            inceptionDate: '2017-01-01',
            nav: 1.46726,
          },
          value: 100000,
          unavailableValue: 0,
          currency: 'EUR',
          activeContributions: true,
          contributions: 112233.44,
          subtractions: 0,
          profit: -12233.44,
          units: 100000 / 1.46726,
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
            inceptionDate: '2017-01-01',
            nav: 0.7813, // cross-referenced from fund backend, those values are actually used
          },
          value: 5699.36,
          unavailableValue: 0,
          currency: 'EUR',
          activeContributions: true,
          contributions: 9876.54,
          subtractions: 0,
          profit: -1876.54,
          units: 5699.36 / 0.7813,
        },
      ];
      return res(ctx.json(fundBalances || defaultFundBalances));
    }),
  );
}

export function fundsBackend(server: SetupServerApi): void {
  server.use(rest.get('http://localhost/v1/funds', (req, res, ctx) => res(ctx.json(mockFunds))));
}

let returnData: ReturnsResponse | undefined;

export function setReturnsData(data: ReturnsResponse | undefined): void {
  returnData = data;
}

export function returnsBackend(server: SetupServerApi): void {
  server.use(
    rest.get('http://localhost/v1/returns', (req, res, ctx) => {
      const data = returnData || {
        from: '2018-06-06',
        returns: [
          {
            key: 'UNION_STOCK_INDEX',
            rate: 0.09,
            amount: 16000.0,
            paymentsSum: 14000.0,
            currency: 'EUR',
            type: 'INDEX',
          },
          {
            key: 'SECOND_PILLAR',
            rate: 0.07,
            amount: 11000.0,
            paymentsSum: 15000.0,
            currency: 'EUR',
            type: 'PERSONAL',
          },
        ],
      };
      return res(ctx.json(data));
    }),
  );
}

export function userCapitalBackend(
  server: SetupServerApi,
  capitalRows: CapitalRow[] = capitalRowsResponse,
): void {
  server.use(
    rest.get('http://localhost/v1/me/capital', (req, res, ctx) => res(ctx.json(capitalRows))),
  );
}

export function applicationsBackend(
  server: SetupServerApi,
  applications: Application[] = [],
): void {
  server.use(
    rest.get('http://localhost/v1/applications', (req, res, ctx) => res(ctx.json(applications))),
  );
}

export function transactionsBackend(server: SetupServerApi): void {
  server.use(rest.get('http://localhost/v1/transactions', (req, res, ctx) => res(ctx.json([]))));
}

export function paymentLinkBackend(server: SetupServerApi): void {
  server.use(
    rest.get('http://localhost/v1/payments/link', (req, res, ctx) => {
      if (req.url.searchParams.get('type') === 'RECURRING') {
        return res(
          ctx.json({
            url:
              `https://${req.url.searchParams.get('paymentChannel')}.EE` +
              `/${req.url.searchParams.get('type')}` +
              `.${req.url.searchParams.get('amount')}` +
              `.${req.url.searchParams.get('currency')}`,
          }),
        );
      }
      return res(
        ctx.json({
          url:
            `https://sandbox-payments.montonio.com?payment_token=example.jwt.token.with` +
            `.${req.url.searchParams.get('amount')}` +
            `.${req.url.searchParams.get('currency')}` +
            `.${req.url.searchParams.get('paymentChannel')}`,
        }),
      );
    }),
  );
}

export function secondPillarPaymentRateBackend(server: SetupServerApi): {
  mandateCreated: boolean;
} {
  const backend = {
    mandateCreated: false,
  };
  server.use(
    rest.post('http://localhost/v1/second-pillar-payment-rates', (req, res, ctx) => {
      if (req.headers.get('Authorization') !== 'Bearer an access token') {
        return res(ctx.status(401), ctx.json(authErrorResponse));
      }
      backend.mandateCreated = true;
      return res(ctx.status(200), ctx.json(secondPillarPaymentRateChangeResponse));
    }),
  );
  return backend;
}

export function withdrawalsEligibilityBackend(
  server: SetupServerApi,
  eligibility: WithdrawalsEligibility = {
    age: 60,
    hasReachedEarlyRetirementAge: true,
    canWithdrawThirdPillarWithReducedTax: true,
    recommendedDurationYears: 20,
    arrestsOrBankruptciesPresent: false,
  },
) {
  server.use(
    rest.get('http://localhost/v1/withdrawals/eligibility', (req, res, ctx) =>
      res(ctx.json(eligibility)),
    ),
  );
}

export function memberCapitalListingsBackend(
  server: SetupServerApi,
  listings: MemberCapitalListing[] = [
    {
      id: 1,
      type: 'BUY',
      units: 10,
      pricePerUnit: 2,
      language: 'en',
      isOwnListing: false,
      currency: 'EUR',
      expiryTime: moment().add(1, 'months').toISOString(),
      createdTime: moment().subtract(5, 'days').toISOString(),
    },
    {
      id: 2,
      type: 'SELL',
      units: 100,
      pricePerUnit: 2.5,
      currency: 'EUR',
      isOwnListing: false,
      language: 'et',
      expiryTime: moment().add(1, 'months').toISOString(),
      createdTime: moment().subtract(5, 'days').toISOString(),
    },
    {
      id: 3,
      type: 'BUY',
      units: 10000,
      language: 'en',
      pricePerUnit: 2.34,
      currency: 'EUR',
      isOwnListing: true,
      expiryTime: moment().add(1, 'months').toISOString(),
      createdTime: moment().subtract(5, 'days').toISOString(),
    },
  ],
) {
  server.use(
    rest.get('http://localhost/v1/listings', (req, res, ctx) => res(ctx.json(listings))),
    rest.post('http://localhost/v1/listings', (req, res, ctx) => {
      const body = req.body as Record<string, unknown>;

      return res(
        ctx.json({
          ...body,
          id: 99,
          createdTime: moment().toISOString(),
        }),
      );
    }),
    rest.post('http://localhost/v1/listings/*/contact', (req, res, ctx) =>
      res(ctx.json({ status: 'sent' })),
    ),
    rest.delete('http://localhost/v1/listings/*', (req, res, ctx) => res()),
  );
}

export function memberLookupBackend(
  server: SetupServerApi,
  member: MemberLookup = {
    id: 1,
    memberNumber: 9999,
    firstName: 'Olev',
    lastName: 'Ostja',
    personalCode: '30303039914',
  },
) {
  server.use(
    rest.get('http://localhost/v1/members/lookup', (req, res, ctx) => {
      if (req.url.searchParams.get('personalCode') !== member.personalCode) {
        return res(ctx.status(400));
      }

      return res(ctx.json(member));
    }),
  );
}

export function capitalTransferContractBackend(
  server: SetupServerApi,
  contract: CapitalTransferContract = {
    id: 1,
    buyer: {
      id: 1,
      memberNumber: 10,
      firstName: 'Olev',
      lastName: 'Ostja',
      personalCode: '30303039914',
    },
    seller: {
      id: 2,
      memberNumber: mockUser.memberNumber as number,
      firstName: mockUser.firstName,
      lastName: mockUser.lastName,
      personalCode: mockUser.personalCode,
    },
    iban: 'EE_TEST_IBAN',
    unitPrice: 2,
    unitCount: 1000,
    unitsOfMemberBonus: 10,
    state: 'SELLER_SIGNED',
    createdAt: '2025-07-21T07:00:00+0000',
    updatedAt: '2025-07-21T07:00:00+0000',
  },
  currentRole: 'BUYER' | 'SELLER' = 'SELLER',
  activeContracts: CapitalTransferContract[] = [],
) {
  let { state } = contract;
  server.use(
    rest.post('http://localhost/v1/capital-transfer-contracts/', (req, res, ctx) =>
      res(ctx.json({ ...contract, state })),
    ),
    rest.get('http://localhost/v1/capital-transfer-contracts/', (req, res, ctx) =>
      res(ctx.json([{ ...contract, state }, ...activeContracts])),
    ),
    rest.get('http://localhost/v1/capital-transfer-contracts/1', (req, res, ctx) =>
      res(ctx.json({ ...contract, state })),
    ),
    rest.patch<{ state: UpdateCapitalTransferContractDto['state'] }>(
      'http://localhost/v1/capital-transfer-contracts/1',
      (req, res, ctx) => {
        state = req.body.state;
        return res(ctx.json({ ...contract, state }));
      },
    ),
  );

  const signingBackend = {
    signed: false,
    statusCount: 0,
  };

  server.use(
    rest.put(
      'http://localhost/v1/capital-transfer-contracts/1/signature/smart-id',
      (req, res, ctx) => {
        if (req.headers.get('Authorization') !== 'Bearer an access token') {
          return res(ctx.status(401), ctx.json(authErrorResponse));
        }
        signingBackend.signed = true;
        return res(ctx.status(200), ctx.json(getMobileSignatureResponse(null)));
      },
    ),
    rest.get(
      'http://localhost/v1/capital-transfer-contracts/1/signature/smart-id/status',
      (req, res, ctx) => {
        if (req.headers.get('Authorization') !== 'Bearer an access token') {
          return res(ctx.status(401), ctx.json(authErrorResponse));
        }

        signingBackend.statusCount += 1;

        if (signingBackend.statusCount >= 2) {
          state = `${currentRole}_SIGNED`;
          return res(ctx.status(200), ctx.json(getMobileSignatureStatusResponse('SIGNATURE')));
        }

        return res(
          ctx.status(200),
          ctx.json(getMobileSignatureStatusResponse('OUTSTANDING_TRANSACTION')),
        );
      },
    ),
  );
  return signingBackend;
}

export function fundPensionStatusBackend(
  server: SetupServerApi,
  fundPensionStatus: FundPensionStatus = {
    fundPensions: [],
  },
) {
  server.use(
    rest.get('http://localhost/v1/withdrawals/fund-pension-status', (req, res, ctx) =>
      res(ctx.json(fundPensionStatus)),
    ),
  );
}

export function capitalEventsBackend(server: SetupServerApi, capitalEvents: CapitalEvent[] = []) {
  server.use(
    rest.get('http://localhost/v1/me/capital/events', (req, res, ctx) =>
      res(ctx.json(capitalEvents)),
    ),
  );
}

export function mandateDeadlinesBackend(server: SetupServerApi): void {
  server.use(
    rest.get('http://localhost/v1/mandate-deadlines', (req, res, ctx) =>
      res(ctx.json(mandateDeadlinesResponse)),
    ),
  );
}

export function mandatesBackend(
  server: SetupServerApi,
  expectedRequest: unknown | null = null,
  pillar: 2 | 3 = 2,
) {
  server.use(
    rest.post('http://localhost/v1/mandates', (req, res, ctx) => {
      if (
        expectedRequest !== null &&
        JSON.stringify(req.body) !== JSON.stringify(expectedRequest)
      ) {
        return res(ctx.status(500), ctx.json({ error: 'wrong request body for mandate' }));
      }

      return res(ctx.json({ id: 1, pillar }));
    }),
  );
}

const TEST_BACKENDS = {
  cancellation: cancellationBackend,
  mandatePreview: mandatePreviewBackend,
  smartIdMandateSigning: smartIdMandateSigningBackend,
  smartIdMandateBatchSigning: smartIdMandateBatchSigningBackend,
  smartIdAuthentication: smartIdAuthenticationBackend,
  mobileIdAuthentication: mobileIdAuthenticationBackend,
  idCardAuthentication: idCardAuthenticationBackend,
  partnerAuthentication: partnerAuthenticationBackend,
  user: userBackend,
  userConversion: userConversionBackend,
  amlChecks: amlChecksBackend,
  pensionAccountStatement: pensionAccountStatementBackend,
  funds: fundsBackend,
  returns: returnsBackend,
  userCapital: userCapitalBackend,
  applications: applicationsBackend,
  transactions: transactionsBackend,
  paymentLink: paymentLinkBackend,
  secondPillarPaymentRate: secondPillarPaymentRateBackend,
  withdrawalsEligibility: withdrawalsEligibilityBackend,
  fundPensionStatus: fundPensionStatusBackend,
  capitalEvents: capitalEventsBackend,
  mandateDeadlines: mandateDeadlinesBackend,
  mandateBatch: mandateBatchBackend,
  mandates: mandatesBackend,
  memberCapitalListings: memberCapitalListingsBackend,
  capitalTransferContract: capitalTransferContractBackend,
  memberLookup: memberLookupBackend,
} as const;

export type TestBackendName = keyof typeof TEST_BACKENDS;

export function useTestBackends(server: SetupServerApi) {
  return useTestBackendsExcept(server, []);
}

export function useTestBackendsExcept(
  server: SetupServerApi,
  backendsToExclude: TestBackendName[],
) {
  const testBackendsToUse = Object.keys(TEST_BACKENDS)
    .filter((name) => !backendsToExclude.includes(name as TestBackendName))
    .map((name) => TEST_BACKENDS[name as TestBackendName]);

  testBackendsToUse.forEach((backend) => backend(server));
}
