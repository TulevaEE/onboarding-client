import { fetchPublishedDocuments, shippedDocuments } from './savingsFundDocumentsCheck';

const liveCheckEnabled = process.env.CHECK_PUBLISHED_DOCUMENTS === 'true';

(liveCheckEnabled ? describe : describe.skip)('savings fund documents (live)', () => {
  test('onboarding links to the documents currently published on tuleva.ee', async () => {
    const published = await fetchPublishedDocuments();

    expect(shippedDocuments()).toEqual(published);
  }, 30000);
});
