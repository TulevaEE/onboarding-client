import { pageLanguage } from './pageLanguage';

describe('the language a page opens in', () => {
  const englishLogin = () => 'en';
  const noPendingLogin = () => null;

  it('follows the language in the address', () => {
    expect(pageLanguage({ pathname: '/account', search: '?language=en' }, noPendingLogin)).toBe(
      'en',
    );
    expect(
      pageLanguage({ pathname: '/login/smart-id/callback', search: '?language=et' }, englishLogin),
    ).toBe('et');
  });

  it('is Estonian when the address names none', () => {
    expect(pageLanguage({ pathname: '/account', search: '' }, englishLogin)).toBe('et');
  });

  it('continues a Smart-ID login in the language it was started in', () => {
    expect(pageLanguage({ pathname: '/login/smart-id/callback', search: '' }, englishLogin)).toBe(
      'en',
    );
  });

  it('ignores a pending login language it does not offer', () => {
    expect(pageLanguage({ pathname: '/login/smart-id/callback', search: '' }, () => 'ru')).toBe(
      'et',
    );
  });
});
