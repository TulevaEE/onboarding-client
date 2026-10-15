import { useMemo } from 'react';

import { withSessionStorage } from '../siteStorage';

const TEST_MODE_KEY_NAME = 'TEST_MODE';

export const writeTestMode = () =>
  withSessionStorage((storage) => storage.setItem(TEST_MODE_KEY_NAME, 'true'), undefined);
export const isTestMode = () =>
  withSessionStorage((storage) => storage.getItem(TEST_MODE_KEY_NAME) !== null, false);
export const useTestMode = () => useMemo(isTestMode, []);

export const shouldWriteTestMode = () => new URLSearchParams(window.location.search).has('test');
