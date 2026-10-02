const STORAGE_KEY = 'rememberMe';

export function readRememberMeChoice(): boolean | null {
  try {
    const choice = window.localStorage.getItem(STORAGE_KEY);
    return choice === null ? null : choice === 'true';
  } catch (error) {
    return null;
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
