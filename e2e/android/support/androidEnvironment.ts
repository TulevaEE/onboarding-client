import path from 'path';

export const androidEnvironment = {
  outputDirectory: path.resolve(process.env.E2E_ANDROID_OUT ?? path.join(__dirname, '..', 'out')),
  attended: process.env.E2E_ANDROID_ATTENDED === 'true',
  attendedWaitMillis: Number(process.env.E2E_ANDROID_ATTENDED_WAIT_SECONDS ?? 180) * 1000,
};
