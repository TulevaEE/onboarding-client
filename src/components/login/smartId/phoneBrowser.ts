export const inSamsungInternet = (userAgent: string = navigator.userAgent): boolean =>
  /SamsungBrowser\//.test(userAgent);

export const inBraveOnAndroid = (): boolean =>
  'brave' in navigator && /Android/.test(navigator.userAgent);
