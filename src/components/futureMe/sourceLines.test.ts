import translations from '../translations';

const futureMeTexts = (pattern: RegExp) =>
  Object.entries(translations.et)
    .filter(([key, text]) => key.startsWith('futureMe.') && pattern.test(text))
    .map(([key]) => key);

describe('source lines', () => {
  it('date the data, not when it was checked or read', () => {
    expect(futureMeTexts(/kontrollitud|loetud \d|kehtiv sõnastus|redaktsioonid/)).toEqual([]);
  });

  it('name the calculator by the product, not by the code repository', () => {
    expect(futureMeTexts(/onboarding-client|Tuleva kalkulaator/)).toEqual([]);
  });
});
