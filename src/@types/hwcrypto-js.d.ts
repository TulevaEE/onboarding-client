// TODO migrate to web-eid-library
declare module 'hwcrypto-js' {
  export interface Certificate {
    hex: string;
  }

  export interface Signature {
    hex: string;
  }

  declare function getCertificate(args: {
    lang: 'en';
    filter?: unknown;
    info?: unknown;
  }): Promise<Certificate>;

  declare function sign(
    Certificate: Certificate,
    options: {
      type: 'SHA-256';
      hex: string;
    },
    certOptions: { lang: 'en' },
  ): Promise<Signature>;
}
