export const userAgents = {
  iPhoneSafariIos26:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.4 Mobile/15E148 Safari/604.1',
  iPhoneSafariIos27:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Mobile/15E148 Safari/604.1',
  iPhoneChrome:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/156.0.7795.64 Mobile/15E148 Safari/604.1',
  androidChrome:
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Mobile Safari/537.36',
  samsungInternet:
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/29.0 Chrome/136.0.0.0 Mobile Safari/537.36',
  facebookIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/530.0.0.38.105;FBBV/773006580;FBDV/iPhone17,1;FBMD/iPhone;FBSN/iOS;FBSV/26.4;FBSS/3;FBCR/;FBID/phone;FBLC/et_EE;FBOP/80]',
  facebookAndroid:
    'Mozilla/5.0 (Linux; Android 16; SM-S921B Build/BP4A.251205.006; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/156.0.8078.25 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/530.0.0.47.76;]',
  messengerAndroid:
    'Mozilla/5.0 (Linux; Android 16; SM-S921B Build/BP4A.251205.006; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/156.0.8078.25 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/582.0.0.61.92;]',
  messengerIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/MessengerForiOS;FBAV/530.0.0.30.109;FBBV/771122334;FBDV/iPhone17,1;FBMD/iPhone;FBSN/iOS;FBSV/26.4;FBSS/3;FBCR/;FBID/phone;FBLC/et_EE;FBOP/5]',
  instagramIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 400.0.0.38.94 (iPhone17,1; iOS 26_4; et_EE; et; scale=3.00; 1206x2622; 812345678; IABMV/1)',
  threadsIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Barcelona 400.0.0.25.92 (iPhone17,1; iOS 26_4; et_EE; et; scale=3.00; 1206x2622; 812345679)',
  googleAppIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/390.0.789012345 Mobile/15E148 Safari/604.1',
  linkedInIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [LinkedInApp]/9.31.1450',
  tikTokAndroid:
    'Mozilla/5.0 (Linux; Android 15; Pixel 9 Build/AP4A.250205.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/156.0.7795.64 Mobile Safari/537.36 musical_ly_2026090030 JsSdk/1.0 NetType/WIFI Channel/googleplay AppName/musical_ly app_version/42.9.3 ByteLocale/et ByteFullLocale/et Region/EE AppId/1233 Spark/1.7.6-alpha.4 AppVersion/42.9.3 BytedanceWebview/d8a21c6',
} as const;

export type UserAgentName = keyof typeof userAgents;
