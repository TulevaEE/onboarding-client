const withoutTrailingSlash = (url: string): string => url.replace(/\/+$/, '');

const clientScheme = process.env.E2E_CLIENT_HTTPS === 'true' ? 'https' : 'http';
const clientPort = process.env.E2E_CLIENT_PORT ?? '3200';

export const environment = {
  baseUrl: withoutTrailingSlash(
    process.env.E2E_BASE_URL ?? `${clientScheme}://localhost:${clientPort}`,
  ),
  smartIdMockUrl: withoutTrailingSlash(
    process.env.SMART_ID_MOCK_URL ?? 'https://sid.demo.sk.ee/mock',
  ),
  smartIdDocumentNumber: process.env.SMART_ID_DOCUMENT_NUMBER ?? 'PNOEE-40404040009-MOCK-Q',
};
