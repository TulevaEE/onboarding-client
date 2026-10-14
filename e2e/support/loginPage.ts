import { BrowserContext, Locator, Page, Response, expect } from '@playwright/test';

const SMART_ID_LOGIN_START_PATH = '/v1/smart-id/login';
const SMART_ID_QR_CODE_PATH = '/v1/smart-id/login/qr-code';
const SMART_ID_CALLBACK_PATH = '/v1/smart-id/login/callback';
const TOKEN_PATH = '/oauth/token';
const STILL_WAITING_FOR_THE_SMART_ID_APP = 'AUTHENTICATION_NOT_COMPLETE';
const NO_CONTENT_KEEPS_THE_CURRENT_PAGE = 204;

const pathOf = (response: Response): string => new URL(response.url()).pathname;

const isPost = (response: Response): boolean => response.request().method() === 'POST';

export const isSmartIdLoginStart = (response: Response): boolean =>
  isPost(response) && pathOf(response) === SMART_ID_LOGIN_START_PATH;

export const isSmartIdCallback = (response: Response): boolean =>
  isPost(response) && pathOf(response) === SMART_ID_CALLBACK_PATH;

const isFreshSmartIdQrCode = (response: Response): boolean =>
  pathOf(response) === SMART_ID_QR_CODE_PATH && response.ok();

const isTokenRedemption = (response: Response): boolean =>
  isPost(response) && pathOf(response) === TOKEN_PATH;

const opensTheSmartIdApp = (url: URL): boolean =>
  url.searchParams.get('deviceLinkType') === 'Web2App';

export type TokenAnswer = { loggedIn: true } | { loggedIn: false; errorCode: string };

const tokenAnswerOf = async (response: Response): Promise<TokenAnswer | null> => {
  const body = await response.json().catch(() => ({}));
  if (body.access_token) {
    return { loggedIn: true };
  }
  const errorCode: string | undefined = body.error ?? body.errors?.[0]?.code;
  if (errorCode === STILL_WAITING_FOR_THE_SMART_ID_APP || (!errorCode && response.ok())) {
    return null;
  }
  return { loggedIn: false, errorCode: errorCode ?? `HTTP ${response.status()}` };
};

const isFinalTokenAnswer = async (response: Response): Promise<boolean> =>
  isTokenRedemption(response) && (await tokenAnswerOf(response)) !== null;

export async function finalTokenAnswer(page: Page): Promise<TokenAnswer> {
  const response = await page.waitForResponse(isFinalTokenAnswer, { timeout: 60000 });
  const answer = await tokenAnswerOf(response);
  if (!answer) {
    throw new Error(`Token endpoint gave no final answer: url=${response.url()}`);
  }
  return answer;
}

export async function stayInTheBrowserWhenTheSmartIdAppOpens(
  context: BrowserContext,
): Promise<void> {
  await context.route(opensTheSmartIdApp, (route) =>
    route.fulfill({ status: NO_CONTENT_KEEPS_THE_CURRENT_PAGE }),
  );
}

export async function chooseSmartId(page: Page): Promise<Locator> {
  await page.getByRole('tab', { name: 'Smart-ID' }).click();
  return page.getByRole('tabpanel', { name: 'Smart-ID' });
}

export async function openTheSmartIdLoginFrom(page: Page, link: string): Promise<Locator> {
  await page.goto(link);
  await expect(page).toHaveURL((url) => url.pathname === '/login');
  return chooseSmartId(page);
}

export const logInButtonOf = (smartIdTab: Locator): Locator =>
  smartIdTab.getByRole('button', { name: 'Sisenen' });

export async function web2AppLinkOpenedBy(page: Page, tap: () => Promise<void>): Promise<string> {
  await stayInTheBrowserWhenTheSmartIdAppOpens(page.context());
  const started = page.waitForResponse(isSmartIdLoginStart);
  await tap();
  const { web2AppLink } = await (await started).json();
  expect(web2AppLink).toBeTruthy();
  return web2AppLink;
}

export const tapLogInToOpenTheSmartIdApp = (page: Page): Promise<string> =>
  web2AppLinkOpenedBy(page, async () => logInButtonOf(await chooseSmartId(page)).click());

export async function linkInTheShownQrCode(page: Page): Promise<string> {
  await expect(page.getByRole('img', { name: /Skänni Smart.ID rakendusega/ })).toBeVisible();
  const freshQrCode = await page.waitForResponse(isFreshSmartIdQrCode);
  const { deviceLink } = await freshQrCode.json();
  expect(deviceLink).toBeTruthy();
  return deviceLink;
}

export async function showTheSmartIdQrCodeOnTheComputer(page: Page): Promise<string> {
  await logInButtonOf(await chooseSmartId(page)).click();
  return linkInTheShownQrCode(page);
}

export async function showTheSmartIdQrCodeOnThePhone(page: Page): Promise<string> {
  await (await chooseSmartId(page)).getByRole('button', { name: 'Näita QR-koodi' }).click();
  return linkInTheShownQrCode(page);
}
