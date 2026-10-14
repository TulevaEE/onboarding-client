import { APIRequestContext, expect } from '@playwright/test';

import { environment } from './environment';

const LONGEST_CALLBACK_WAIT_THE_MOCK_SERVICE_ALLOWS_MILLIS = 30000;
const ANY_BROWSER_COOKIE_THE_MOCK_SERVICE_ACCEPTS = 'e2e=smart-id-app';

export type SmartIdApp = {
  confirm: (deviceLink: string) => Promise<void>;
  callbackUrl: (web2AppLink: string) => Promise<string>;
  confirmAndReturn: (web2AppLink: string) => Promise<string>;
};

const sessionTokenOf = (deviceLink: string): string => {
  const sessionToken = new URL(deviceLink).searchParams.get('sessionToken');
  if (!sessionToken) {
    throw new Error(`Device link has no sessionToken: deviceLink=${deviceLink}`);
  }
  return sessionToken;
};

const onTheTestedSite = (callbackUrl: string): string => {
  const callback = new URL(callbackUrl);
  const site = new URL(environment.baseUrl);
  callback.protocol = site.protocol;
  callback.host = site.host;
  return callback.toString();
};

export function smartIdAppOf(
  mockService: APIRequestContext,
  documentNumber: string = environment.smartIdDocumentNumber,
): SmartIdApp {
  const confirm = async (deviceLink: string): Promise<void> => {
    const response = await mockService.post(`${environment.smartIdMockUrl}/device-link`, {
      data: {
        documentNumber,
        deviceLink,
        browserCookie: ANY_BROWSER_COOKIE_THE_MOCK_SERVICE_ACCEPTS,
        disableCallbackGetRequest: true,
      },
    });
    expect(response.status(), await response.text()).toBe(200);
  };

  const callbackUrl = async (web2AppLink: string): Promise<string> => {
    const response = await mockService.get(
      `${environment.smartIdMockUrl}/device-link/callback-url/${sessionTokenOf(web2AppLink)}`,
      {
        params: { timeoutMs: LONGEST_CALLBACK_WAIT_THE_MOCK_SERVICE_ALLOWS_MILLIS },
        timeout: LONGEST_CALLBACK_WAIT_THE_MOCK_SERVICE_ALLOWS_MILLIS + 5000,
      },
    );
    expect(response.status(), await response.text()).toBe(200);
    return onTheTestedSite((await response.json()).callbackUrl);
  };

  const confirmAndReturn = async (web2AppLink: string): Promise<string> => {
    await confirm(web2AppLink);
    return callbackUrl(web2AppLink);
  };

  return { confirm, callbackUrl, confirmAndReturn };
}
