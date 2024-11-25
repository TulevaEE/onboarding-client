import { useMemo } from 'react';

const TEST_MODE_KEY_NAME = 'TEST_MODE';

export const writeTestMode = () => sessionStorage.setItem(TEST_MODE_KEY_NAME, 'true');
export const isTestMode = () => sessionStorage.getItem(TEST_MODE_KEY_NAME) !== null;
export const useTestMode = () =>
  useMemo(() => sessionStorage.getItem(TEST_MODE_KEY_NAME) !== null, []);

export const shouldWriteTestMode = () => new URLSearchParams(window.location.search).has('test');
