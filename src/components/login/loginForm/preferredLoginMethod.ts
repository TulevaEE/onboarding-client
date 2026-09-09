const STORAGE_KEY = 'preferredLoginMethod';

export function readPreferredLoginMethod(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    return null;
  }
}

export function savePreferredLoginMethod(method: string): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, method);
    return true;
  } catch (error) {
    return false;
  }
}
