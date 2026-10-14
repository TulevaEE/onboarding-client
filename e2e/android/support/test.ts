import fs from 'fs';
import path from 'path';

import { test as base } from '../../support/test';
import { environment } from '../../support/environment';
import { androidEnvironment } from './androidEnvironment';
import { closeChromeTabsOn } from './browserTabs';
import { LoginTraffic, startLoginTrafficRecorder } from './loginTraffic';
import {
  Phone,
  expectThePhoneUnlocked,
  goToTheHomeScreen,
  phoneFor,
  removePhonePortReverse,
  reversePhonePort,
} from './phone';

type TestedSite = { hostname: string; port: number; addressPrefixesOfItsTabs: string[] };

type PerScenario = { phone: Phone };
type PerRun = {
  androidOutputDirectory: string;
  testedSite: TestedSite;
  screensDirectory: string;
  loginTraffic: LoginTraffic;
  phoneTidiedAtTheEnd: void;
};

const SMART_ID_DEVICE_LINK_PATH = '/device-link';

const testedSiteOf = (baseUrl: string): TestedSite => {
  const site = new URL(baseUrl);
  if (site.protocol !== 'http:' || !site.port) {
    throw new Error(
      `The phone reaches the client through adb reverse on plain HTTP: E2E_BASE_URL=${baseUrl}`,
    );
  }
  return {
    hostname: site.hostname,
    port: Number(site.port),
    addressPrefixesOfItsTabs: [
      `http://${site.host}/`,
      `https://${site.host}/`,
      `${new URL(environment.smartIdMockUrl).origin}${SMART_ID_DEVICE_LINK_PATH}`,
    ],
  };
};

export const test = base.extend<PerScenario, PerRun>({
  androidOutputDirectory: [androidEnvironment.outputDirectory, { scope: 'worker', option: true }],
  testedSite: [testedSiteOf(environment.baseUrl), { scope: 'worker', option: true }],
  screensDirectory: [
    async ({ androidOutputDirectory }, use) => {
      await use(path.join(androidOutputDirectory, 'screens'));
    },
    { scope: 'worker' },
  ],
  loginTraffic: [
    async ({ androidOutputDirectory, testedSite }, use) => {
      fs.mkdirSync(androidOutputDirectory, { recursive: true });
      const traffic = await startLoginTrafficRecorder(
        { hostname: testedSite.hostname, port: testedSite.port },
        path.join(androidOutputDirectory, 'login-traffic.jsonl'),
      );
      await reversePhonePort(testedSite.port, traffic.port);
      await use(traffic);
      await removePhonePortReverse(testedSite.port);
      await traffic.close();
    },
    { scope: 'worker', auto: true },
  ],
  phoneTidiedAtTheEnd: [
    async ({ testedSite }, use) => {
      await use();
      await closeChromeTabsOn(testedSite.addressPrefixesOfItsTabs);
      await goToTheHomeScreen();
    },
    { scope: 'worker', auto: true },
  ],
  phone: async ({ screensDirectory }, use, testInfo) => {
    await expectThePhoneUnlocked();
    await use(phoneFor(testInfo, screensDirectory));
  },
});

export { expect } from '@playwright/test';
