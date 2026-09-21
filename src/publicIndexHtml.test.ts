import { readFileSync } from 'fs';
import { join } from 'path';

describe('the html every page is served from', () => {
  it('keeps the app out of search indexes', () => {
    // A gift URL carries a token that names a child, and this host is the application rather
    // than the public site, so nothing here belongs in a search index.
    const indexHtml = readFileSync(join(__dirname, '..', 'public', 'index.html'), 'utf8');

    expect(indexHtml).toContain('<meta name="robots" content="noindex, nofollow" />');
  });
});
