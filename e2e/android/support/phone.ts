import fs from 'fs';
import path from 'path';
import { TestInfo, test } from '@playwright/test';

import { adb, adbShell, singleQuotedForTheDeviceShell } from './adb';
import { Label, ScreenNode, findNode, nodeWithId, nodesOf } from './screen';

export type Browser = { name: string; packageName: string };

export const CHROME: Browser = { name: 'Chrome', packageName: 'com.android.chrome' };
export const SAMSUNG_INTERNET: Browser = {
  name: 'Samsung Internet',
  packageName: 'com.sec.android.app.sbrowser',
};
export const MESSENGER_IN_APP_BROWSER =
  'com.facebook.orca/com.facebook.browser.lite.BrowserLiteActivity';

const ADDRESS_BARS = [
  `${CHROME.packageName}:id/url_bar`,
  `${SAMSUNG_INTERNET.packageName}:id/location_bar_edit_text`,
];
const FOREGROUND_ACTIVITY = /topResumedActivity=ActivityRecord\{\S+ \S+ ([\w.]+)\/([\w.$]+)/;
const LOCK_SCREEN_SHOWING = /isKeyguardShowing=true/;
const COMPLETE_SCREEN_DUMP = '</hierarchy>';
const LEFT_TO_RIGHT_AND_RIGHT_TO_LEFT_MARKS = /[\u200e\u200f]/g;
const SCHEME = /^[a-z][\w+.-]*:\/\//i;
const COMBINING_MARKS = /[\u0300-\u036f]/g;
const POLL_INTERVAL_MILLIS = 500;
const SCREEN_DUMP_ATTEMPTS = 10;
const LONGEST_PAGE_LOAD_MILLIS = 30000;

export type Phone = {
  open: (url: string, browser: Browser) => Promise<void>;
  openLikeTheSmartIdApp: (url: string) => Promise<void>;
  defaultBrowserFor: (url: string) => Promise<string>;
  foregroundActivity: () => Promise<string>;
  foregroundApp: () => Promise<string>;
  screen: () => Promise<ScreenNode[]>;
  isShown: (label: Label) => Promise<boolean>;
  waitFor: (label: Label, timeoutMillis?: number) => Promise<ScreenNode>;
  tap: (label: Label) => Promise<void>;
  addressInTheBar: () => Promise<string>;
  step: <T>(title: string, action: () => Promise<T>) => Promise<T>;
};

const delay = (millis: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, millis);
  });

const packageOf = (component: string): string => component.split('/')[0];

const slugOf = (title: string): string =>
  title
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .replace(/[^\w]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 120);

export const withoutScheme = (address: string): string => address.replace(SCHEME, '');

async function foregroundActivity(): Promise<string> {
  const activities = await adbShell('dumpsys activity activities');
  const [, packageName, activity] = activities.match(FOREGROUND_ACTIVITY) ?? [];
  if (!packageName) {
    throw new Error('No foreground activity on the phone');
  }
  return `${packageName}/${activity.startsWith('.') ? packageName + activity : activity}`;
}

const showsOnlyTheTestedSite = (component: string): boolean =>
  [CHROME.packageName, SAMSUNG_INTERNET.packageName].includes(packageOf(component)) ||
  component === MESSENGER_IN_APP_BROWSER;

export async function expectThePhoneUnlocked(): Promise<void> {
  await adbShell('input keyevent KEYCODE_WAKEUP');
  if (LOCK_SCREEN_SHOWING.test(await adbShell('dumpsys window'))) {
    throw new Error('Unlock the phone: the lock screen is showing');
  }
}

export async function goToTheHomeScreen(): Promise<void> {
  await adbShell('input keyevent KEYCODE_HOME');
}

export async function reversePhonePort(phonePort: number, computerPort: number): Promise<void> {
  await adb(['reverse', `tcp:${phonePort}`, `tcp:${computerPort}`]);
}

export async function removePhonePortReverse(phonePort: number): Promise<void> {
  await adb(['reverse', '--remove', `tcp:${phonePort}`]);
}

async function startViewing(url: string, packageOption: string): Promise<void> {
  const answer = await adbShell(
    `am start -a android.intent.action.VIEW -d ${singleQuotedForTheDeviceShell(
      url,
    )}${packageOption}`,
  );
  if (answer.includes('Error')) {
    throw new Error(`Phone did not open the link: url=${url}, answer=${answer}`);
  }
}

async function screen(attemptsLeft = SCREEN_DUMP_ATTEMPTS): Promise<ScreenNode[]> {
  const dump = (await adb(['exec-out', 'uiautomator', 'dump', '/dev/tty'])).toString('utf8');
  if (dump.includes(COMPLETE_SCREEN_DUMP)) {
    return nodesOf(dump);
  }
  if (attemptsLeft <= 1) {
    throw new Error(`uiautomator could not read the screen: answer=${dump.slice(0, 200)}`);
  }
  await delay(POLL_INTERVAL_MILLIS);
  return screen(attemptsLeft - 1);
}

async function waitUntilShown(label: Label, deadline: number): Promise<ScreenNode | undefined> {
  const node = findNode(await screen(), label);
  if (node || Date.now() > deadline) {
    return node;
  }
  await delay(POLL_INTERVAL_MILLIS);
  return waitUntilShown(label, deadline);
}

async function waitFor(
  label: Label,
  timeoutMillis = LONGEST_PAGE_LOAD_MILLIS,
): Promise<ScreenNode> {
  const node = await waitUntilShown(label, Date.now() + timeoutMillis);
  if (!node) {
    throw new Error(
      `Phone did not show ${label}: timeoutMillis=${timeoutMillis}, foreground=${await foregroundActivity()}`,
    );
  }
  return node;
}

async function addressInTheBar(): Promise<string> {
  const nodes = await screen();
  const bar = ADDRESS_BARS.map((id) => nodeWithId(nodes, id)).find(Boolean);
  if (!bar) {
    throw new Error(
      `No browser address bar on the phone: foreground=${await foregroundActivity()}`,
    );
  }
  return withoutScheme(bar.text.replace(LEFT_TO_RIGHT_AND_RIGHT_TO_LEFT_MARKS, '').trim());
}

async function defaultBrowserFor(url: string): Promise<string> {
  const resolved = await adbShell(
    `cmd package resolve-activity --brief -a android.intent.action.VIEW -d ${singleQuotedForTheDeviceShell(
      url,
    )}`,
  );
  return packageOf(resolved.trim().split('\n').pop() ?? '');
}

export function phoneFor(testInfo: TestInfo, outputDirectory: string): Phone {
  const stepsDirectory = path.join(outputDirectory, ...testInfo.titlePath.slice(1).map(slugOf));
  let stepNumber = 0;

  const capture = async (title: string): Promise<void> => {
    stepNumber += 1;
    const name = `${String(stepNumber).padStart(2, '0')}-${slugOf(title)}`;
    const foreground = await foregroundActivity();
    if (!showsOnlyTheTestedSite(foreground)) {
      await testInfo.attach(name, { body: `Not captured: foreground=${foreground}` });
      return;
    }
    const file = path.join(stepsDirectory, `${name}.png`);
    fs.mkdirSync(stepsDirectory, { recursive: true });
    fs.writeFileSync(file, await adb(['exec-out', 'screencap', '-p']));
    await testInfo.attach(name, { path: file, contentType: 'image/png' });
  };

  const step = <T>(title: string, action: () => Promise<T>): Promise<T> =>
    test.step(title, async () => {
      let result: T;
      try {
        result = await action();
      } catch (error) {
        await Promise.allSettled([capture(`${title} failed`)]);
        throw error;
      }
      await capture(title);
      return result;
    });

  return {
    open: (url, browser) => startViewing(url, ` -p ${browser.packageName}`),
    openLikeTheSmartIdApp: (url) => startViewing(url, ''),
    defaultBrowserFor,
    foregroundActivity,
    foregroundApp: async () => packageOf(await foregroundActivity()),
    screen,
    isShown: async (label) => Boolean(findNode(await screen(), label)),
    waitFor,
    tap: async (label) => {
      const { x, y } = await waitFor(label);
      await adbShell(`input tap ${x} ${y}`);
    },
    addressInTheBar,
    step,
  };
}
