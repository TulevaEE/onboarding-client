import englishTranslations from '../../translations/translations.en.json';
import estonianTranslations from '../../translations/translations.et.json';

const TRANSLATIONS = { en: englishTranslations, et: estonianTranslations };

const STATUS_ROW_PREFIXES = [
  'account.status.',
  'account.member.',
  'account.non.member.',
  'savingsFund.status.',
];

const TOOLTIP_PARAGRAPHS = ['account.status.choice.pillar.third.paymentInfo'];

const statusRowLines = (translations: Record<string, string>) =>
  Object.entries(translations).filter(
    ([key]) =>
      STATUS_ROW_PREFIXES.some((prefix) => key.startsWith(prefix)) &&
      !TOOLTIP_PARAGRAPHS.includes(key),
  );

const endsWithFullStop = (text: string) => /\.\s*(<\/\w+>\s*)*$/.test(text);

describe('status box copy', () => {
  it.each(['en', 'et'] as const)('ends no %s status row line with a full stop', (language) => {
    const linesEndingWithFullStop = statusRowLines(TRANSLATIONS[language])
      .filter(([, text]) => endsWithFullStop(text))
      .map(([key]) => key);

    expect(linesEndingWithFullStop).toEqual([]);
  });
});
