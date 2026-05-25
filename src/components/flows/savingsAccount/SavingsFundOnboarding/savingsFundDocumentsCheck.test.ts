import { publishedDocumentsFromAcf, shippedDocuments } from './savingsFundDocumentsCheck';

describe('publishedDocumentsFromAcf', () => {
  test('reads the document URLs from the savings fund page ACF fields', () => {
    const acf = {
      terms_file:
        'https://tuleva.ee/wp-content/uploads/2026/02/Tuleva.eurofond.tingimused.02.02.2026.pdf',
      prospectus_file:
        'https://tuleva.ee/wp-content/uploads/2026/02/TKF100-Prospekt-kehtib-alates-27.02.2026.pdf',
      key_investor_info_file:
        'https://tuleva.ee/wp-content/uploads/2026/02/Pohiteave-TKF100-kehtib-alates-27.02.2026.pdf',
      model_portfolio_file: 'https://tuleva.ee/wp-content/uploads/2026/03/Mudelportfell.pdf',
    };

    expect(publishedDocumentsFromAcf(acf)).toEqual({
      terms:
        'https://tuleva.ee/wp-content/uploads/2026/02/Tuleva.eurofond.tingimused.02.02.2026.pdf',
      prospectus:
        'https://tuleva.ee/wp-content/uploads/2026/02/TKF100-Prospekt-kehtib-alates-27.02.2026.pdf',
      keyInformation:
        'https://tuleva.ee/wp-content/uploads/2026/02/Pohiteave-TKF100-kehtib-alates-27.02.2026.pdf',
    });
  });

  test('fails closed when a document field is missing or empty', () => {
    const acf = {
      terms_file: 'https://tuleva.ee/wp-content/uploads/2026/02/terms.pdf',
      prospectus_file: '',
    };

    expect(() => publishedDocumentsFromAcf(acf)).toThrow(/prospectus_file/);
  });

  test('fails closed when there is no ACF data at all', () => {
    expect(() => publishedDocumentsFromAcf(undefined)).toThrow(/terms_file/);
  });
});

describe('shippedDocuments', () => {
  test('maps the onboarding document constant to a URL per document type', () => {
    expect(shippedDocuments()).toEqual({
      terms:
        'https://tuleva.ee/wp-content/uploads/2026/01/Tuleva-Taiendav-Kogumisfond.-Tingimused.-12.01.2026.pdf',
      prospectus:
        'https://tuleva.ee/wp-content/uploads/2026/01/Tuleva-Taiendav-Kogumisfond.-Prospekt.-12.01.2026.pdf',
      keyInformation:
        'https://tuleva.ee/wp-content/uploads/2026/01/Tuleva-Taiendav-Kogumisfond.-Pohiteabedokument.-12.01.2026.pdf',
    });
  });
});
