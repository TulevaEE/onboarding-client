import { execFile } from 'child_process';

const ADB = process.env.ADB ?? 'adb';
const LARGEST_SCREENSHOT_BYTES = 64 * 1024 * 1024;

export function adb(args: string[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    execFile(
      ADB,
      args,
      { encoding: 'buffer', maxBuffer: LARGEST_SCREENSHOT_BYTES },
      (error, stdout, stderr) => {
        if (error) {
          reject(
            new Error(
              `adb failed: args=${args.join(' ')}, error=${
                error.message
              }, stderr=${stderr.toString()}`,
            ),
          );
          return;
        }
        resolve(stdout);
      },
    );
  });
}

export async function adbShell(command: string): Promise<string> {
  return (await adb(['shell', command])).toString('utf8');
}

export function singleQuotedForTheDeviceShell(value: string): string {
  if (value.includes("'")) {
    throw new Error(`Value cannot be quoted for the device shell: value=${value}`);
  }
  return `'${value}'`;
}
