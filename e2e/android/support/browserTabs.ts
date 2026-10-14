import net, { AddressInfo } from 'net';

import { adb } from './adb';

const CHROME_DEVTOOLS_SOCKET = 'localabstract:chrome_devtools_remote';

type DevToolsTarget = { id: string; type: string; url: string };

const freeComputerPort = (): Promise<number> =>
  new Promise((resolve) => {
    const probe = net.createServer();
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address() as AddressInfo;
      probe.close(() => resolve(port));
    });
  });

const isPageOn =
  (addressPrefixes: string[]) =>
  ({ type, url }: DevToolsTarget): boolean =>
    type === 'page' && addressPrefixes.some((prefix) => url.startsWith(prefix));

export async function closeChromeTabsOn(addressPrefixes: string[]): Promise<void> {
  const port = await freeComputerPort();
  await adb(['forward', `tcp:${port}`, CHROME_DEVTOOLS_SOCKET]);
  try {
    const tabs: DevToolsTarget[] = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    const testTabs = tabs.filter(isPageOn(addressPrefixes));
    await Promise.all(testTabs.map(({ id }) => fetch(`http://127.0.0.1:${port}/json/close/${id}`)));
  } finally {
    await adb(['forward', '--remove', `tcp:${port}`]);
  }
}
