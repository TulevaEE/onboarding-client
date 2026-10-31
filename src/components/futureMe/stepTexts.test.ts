import translations from '../translations';

const texts: Record<'et' | 'en', Record<string, string>> = translations;

const helpTopicsOnYouStep = [
  'sex',
  'pensionAge',
  'p1',
  'gross',
  'p2Rate',
  'p3Monthly',
  'p3Joined',
  'p3OpenAge',
  'fundCur',
  'pillars',
  'special',
  'sp',
  'spStart',
  'hazard',
  'rescue',
  'rescueBasis',
  'civil',
  'soodusYears',
  'kids',
  'kidsSupUser',
  'kidsIIUser',
  'kidsEarlyUser',
  'kidDisabled',
  'kidIIMonths',
];

const helpTopicKeys = (topics: string[]) => (key: string) =>
  topics.some((topic) => key.startsWith(`futureMe.help.${topic}.`));

const isOnYouStep = (key: string) =>
  /^futureMe\.(you|trail|nav|potBar|errorSummary)\./.test(key) ||
  ['futureMe.required', 'futureMe.fundPensionFaq.title'].includes(key) ||
  /^futureMe\.help\.(open|close|newWindow)$/.test(key) ||
  helpTopicKeys(helpTopicsOnYouStep)(key);

const isOnExpensesStep = (key: string) =>
  key.startsWith('futureMe.expenses.') || helpTopicKeys(['household', 'careHome'])(key);

const isOnAge55And60Steps = (key: string) =>
  /^futureMe\.(age55|age60|fundPensionFaq|payoutChoice|choiceMade)\./.test(key);

const isOnAge65AndSpecialPensionSteps = (key: string) =>
  /^futureMe\.(age65|specialPension|firstPillarChoice)\./.test(key);

const isOnAge66Step = (key: string) => key.startsWith('futureMe.age66.');

const isOnResultStep = (key: string) =>
  key.startsWith('futureMe.result.') ||
  helpTopicKeys(['nominal', 'sustainable', 'legacyLeft'])(key);

const steps: [string, (key: string) => boolean][] = [
  ['Sina', isOnYouStep],
  ['Kulud', isOnExpensesStep],
  ['55 ja 60', isOnAge55And60Steps],
  ['65 ja eripension', isOnAge65AndSpecialPensionSteps],
  ['66+', isOnAge66Step],
  ['Tulemus', isOnResultStep],
];

const stepKeys = Object.keys(texts.et).filter((key) => steps.some(([, isOnStep]) => isOnStep(key)));

const spelledTheSameInBothLanguages = [
  'futureMe.trail.sub.pension',
  'futureMe.expenses.category.transport',
  'futureMe.result.rules.civilServiceIncrease.choice',
];

const keysWithText = (language: 'et' | 'en', pattern: RegExp) =>
  stepKeys.filter((key) => pattern.test(texts[language][key]));

const tags = (text: string) =>
  (text.replace(/En>/g, '>').match(/<\/?[a-zA-Z]+>/g) ?? []).sort().join();

const selectBranchKey = /(?:(?:select|plural), |\} )(?:\w+|=\d+) $/;

const placeholders = (text: string) =>
  Array.from(text.matchAll(/\{[a-zA-Z]+[,}]/g))
    .filter(({ index }) => !selectBranchKey.test(text.slice(0, index)))
    .map(([placeholder]) => placeholder);

describe('Step texts', () => {
  it('speak to the saver, not as "we"', () => {
    expect(
      keysWithText('et', /\b(me|meie|arvutame|näitame|arvestame|küsime|eeldame)\b/i).filter(
        (key) => !key.startsWith('futureMe.help.'),
      ),
    ).toEqual([]);
  });

  it('are translated into English', () => {
    const untranslated = stepKeys.filter(
      (key) => !spelledTheSameInBothLanguages.includes(key) && texts.en[key] === texts.et[key],
    );
    expect(untranslated).toEqual([]);
  });

  it('hold no Estonian letters in English, apart from Estonian names', () => {
    const englishWithoutEstonianNames = (key: string) =>
      texts.en[key].replace(/Riigi Teataja|Päästeamet|Sotsiaalkindlustusamet/g, '');
    expect(stepKeys.filter((key) => /[õäöüšž]/i.test(englishWithoutEstonianNames(key)))).toEqual(
      [],
    );
  });

  it('use the agreed English terms', () => {
    expect(keysWithText('en', /pension age|Elukaar|Life Path|regular payments/i)).toEqual([]);
  });

  it('use the words of tuleva.ee and the Social Insurance Board in English', () => {
    expect(
      keysWithText(
        'en',
        /annual value|tax relief|top-up|\b(first|second|third)\s(and\s\w+\s)?pillar/i,
      ),
    ).toEqual([]);
  });

  it('use UK spelling in English, as the Tuleva style guide asks', () => {
    expect(keysWithText('en', /\b(color|defense|favorable)\b/)).toEqual([]);
  });

  it('put the euro sign after an amount, as the app formats amounts in English too', () => {
    expect(keysWithText('en', /€\{/)).toEqual([]);
  });

  it('write dates in English as day, month name and year', () => {
    expect(keysWithText('en', /\b\d{1,2}\.\d{1,2}\.\d{4}\b/)).toEqual([]);
  });

  it('keep the same tags and placeholders in English', () => {
    const changed = stepKeys.filter(
      (key) =>
        tags(texts.en[key]) !== tags(texts.et[key]) ||
        placeholders(texts.et[key]).some((placeholder) => !texts.en[key].includes(placeholder)),
    );
    expect(changed).toEqual([]);
  });
});

describe('Every Tulevane Mina text', () => {
  const futureMeKeys = Object.keys(texts.et).filter((key) => key.startsWith('futureMe.'));

  it('belongs to one of the steps above', () => {
    expect(futureMeKeys.filter((key) => !stepKeys.includes(key))).toEqual([]);
  });

  it('has English that is not the Estonian text', () => {
    expect(
      futureMeKeys.filter(
        (key) =>
          !spelledTheSameInBothLanguages.includes(key) &&
          (texts.en[key] === undefined || texts.en[key] === texts.et[key]),
      ),
    ).toEqual([]);
  });
});
