import translations from '../translations';

const FIXED_PENSION_AGE_PHRASES = [/\b60[-⁠]?aastase/, /\b60\s?a\b/, /pensioniea 65 korral/];

describe('Future Me copy does not hardcode ages that depend on the pension age', () => {
  (['et', 'en'] as const).forEach((language) => {
    it(`has no fixed 60 or 65 pension-age example in the ${language} texts`, () => {
      const offending = Object.entries(translations[language])
        .filter(([key]) => key.startsWith('futureMe.'))
        .filter(([, text]) =>
          FIXED_PENSION_AGE_PHRASES.some((phrase) => phrase.test(String(text).replace(/ /g, ' '))),
        )
        .map(([key]) => key);

      expect(offending).toEqual([]);
    });
  });
});
