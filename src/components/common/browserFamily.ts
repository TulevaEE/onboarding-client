export const inSamsungInternet = (userAgent: string = navigator.userAgent): boolean =>
  /SamsungBrowser\//.test(userAgent);

export const inBrave = (): boolean => 'brave' in navigator;

export const inBraveOnAndroid = (): boolean => inBrave() && /Android/.test(navigator.userAgent);
