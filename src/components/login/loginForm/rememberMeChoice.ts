const STORAGE_KEY = 'rememberMe';

export function readRememberMeChoice(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch (error) {
    return false;
  }
}

export function saveRememberMeChoice(choice: boolean): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(choice));
    return true;
  } catch (error) {
    return false;
  }
}
