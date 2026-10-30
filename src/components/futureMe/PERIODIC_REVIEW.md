# Tulevane Mina: periodic review

None of the values below come from an API. They are written into the code, the data files or the copy, and they go out
of date on a known schedule or when a law changes. Check them on the schedule below, and update them as described in
[How to update a value](#how-to-update-a-value).

All values are as of the 2026 checks. Paths are relative to `src/components/futureMe/`. Copy keys are in
`src/components/translations/translations.{et,en}.json`.

The calculation year (`CURRENT_YEAR`) comes from today's date. Taxes, aastahinne, the average pension and the minimum
wage are tables by year (`*_BY_YEAR` in `engine/pension.ts`): when the new year has no row yet, the latest known year
is used, and the development build warns in the console (`missingYearlyValues`).

## Every January: state budget

Add the new year's row to each table.

| Value | Now (2026) | Code | Source |
| --- | --- | --- | --- |
| Income tax | 22% | `INCOME_TAX_BY_YEAR`, `engine/pension.ts` | EMTA |
| Pensioner's tax-free income | 776 € a month | `PENSIONER_ALLOWANCE_BY_YEAR` | EMTA |
| General tax-free income | 700 € a month | `GENERAL_ALLOWANCE_BY_YEAR` | EMTA |

## Every April: indexation on 1 April

| Value | Now (from 1.04.2026) | Code | Source |
| --- | --- | --- | --- |
| Aastahinne (value of one year's pension unit) | 10,477 € | `AASTAHINNE_BY_YEAR`, `engine/pension.ts` | SKA "Pensioni suurus"; the government's indexation order |
| Average old-age pension with 44 years of service | 860,23 € | `AVG_OLD_AGE_PENSION_BY_YEAR` | Vabariigi Valitsus, SKA |
| Minimum wage | 946 € | `MIN_WAGE_BY_YEAR` | Government regulation on the minimum wage |

## Every year, when Statistikaamet publishes

| Value | Now | Code | Source |
| --- | --- | --- | --- |
| Average gross monthly wage | 2 092 € (2025) | `AVG_WAGE`, `engine/pension.ts` | Statistikaamet PA103 |
| Life expectancy at 65, by year (sets the pension age) | 2018–2025 | `LIFE_EXP_65`, `engine/pension.ts`: add the new year | Statistikaamet RV045 |
| Life table: survivors and remaining years by age and sex | 2025 | `engine/lifeTable.json` | Statistikaamet RV045, RV046 |
| Cost levels by household | survey year 2020, prices as of 2026-09 | `engine/expenses.json`: `studyYear`, `pricesAsOf`, `priceFactor`, `categories` | Statistikaamet household budget survey and consumer price index |

`lifeTable.json` and `expenses.json` were generated outside this repository. How to generate them again is an open
question in [README.md](README.md#open-questions).

## September–October: SKA publishes next year's amounts

| Value | Now | Code | Source |
| --- | --- | --- | --- |
| State II pillar payment for a child under 3 | 2026: 76,12 €, 2027: 80,76 € a month | `CHILD_II_MONTHLY`, `engine/pension.ts`: add the next year | SKA "Perehüvitiste määrad ja maksmine" |
| Flexible pension: increase per year deferred | +7,93% (1 a) … +51,57% (5 a) | `DEFERRAL_INCREASE`; also the text in `decisionMap` ("2026 keskmised") | SKA "Paindlik vanaduspension", SKA pension calculator |
| Flexible pension: decrease per year early | −7,17% (1 a) … −30,67% (5 a) | `EARLY_DECREASE` | Same |
| Single pensioner's benefit | 200 € a year, pension under 992 € a month | not calculated, copy only | SKA "Üksi elava pensionäri toetus" |
| Care home own share | 750, 950 and 1 050 € a month | `CARE_HOME_OWN_SHARES`, `engine/expenses.ts` | SKA, care homes' price lists |
| Last pension age set by regulation | 2029 (65 a 4 k) | `known = year <= 2029` in `pensionAge`; the 2027–2029 test in `engine/pension.test.ts` | Minister's regulation, two years ahead (RPKS § 7) |

## Tuleva's own assumptions: when Tuleva changes them

| Value | Now | Code |
| --- | --- | --- |
| Wage growth | 3% a year | `WAGE_GROWTH`, `engine/pension.ts` |
| Inflation | 2% a year | `INFLATION`, `engine/pension.ts` |
| Fund return choice | −10% … +10% a year before inflation, default 0% | `RETURN_PERCENT_OPTIONS`, `DEFAULT_RETURN_PERCENT`, `youAnswers.ts` |
| Historical return shown in the help | 7% | `HISTORICAL_RETURN_PERCENT`, `youAnswers.ts` |
| Deposit return after inflation | −1% a year | `DEPOSIT_REAL_RETURN`, `engine/pension.ts` |
| Prices in "what a level buys" | fuel tank 80 €, package trip 900 €, café lunch 12 € | `PRICE`, `engine/expenses.ts` |

## When a law changes

Read the new consolidated text in Riigi Teataja when it is published. The 2027-01-01 text of the funded pensions act
(KoPS) has not been read yet.

| Rule | Now | Code | Law |
| --- | --- | --- | --- |
| Tax on a lump sum or a short fund pension | 10% | `TAX_SHORT`, `engine/pension.ts` | TuMS § 21 |
| III pillar lower-tax age | 55 if joined before 2021, else 5 years before the pension age | `thirdPillarPayoutAges.ts`, `decisionMap` | KoPS § 63 lg 3, § 72⁷ |
| II pillar payouts open | 5 years before the pension age | `YEARS_BEFORE_PENSION_AGE`, `planAges.ts` | KoPS |
| State II pillar contribution | 4% | `STATE_SECOND_PILLAR_RATE`, `specialPensionAnswers.ts` | KoPS, sotsiaalmaksuseadus |
| Children's pension supplement | 3,5 aastahinnet a child | `childSupplement`, `engine/pension.ts` | RPKS § 24 lg 1¹, § 28 lg 2 p 12 |
| Hazardous work | 0,031 and 0,219 aastahinnet a year; 10 or 12,5 years needed, 20 or 25 years of service | `hazardSupplement`, `engine/pension.ts`; `HAZARD_YEARS_NEEDED`, `SERVICE_YEARS_NEEDED`, `YouOptionalBlocks.tsx` | SVPS § 1, § 3 |
| Rescue and civil service increase | 10% … 50% by years of service; rescue until 28.02.2043 | `rescueIncrease`, `RESCUE_LAST_YEAR`, `engine/pension.ts` | PäästeTS § 18, ATS § 113 |

## Numbers repeated in the copy

The help texts and FAQs repeat many of these numbers, and some say when they were checked ("kontrollitud …"). After
changing a value, search the copy for the old number:

```bash
scripts/edit-translation.py list et futureMe | grep '10,48'
```

The keys that repeat yearly numbers today:

| Number | Keys |
| --- | --- |
| Aastahinne (10,48 €) | `futureMe.age65.faq.yearScore.a`, `futureMe.help.kids.body` |
| Child's II pillar payment (76,12 €, 80,76 €) | `futureMe.help.kids.body`, `futureMe.help.kidsIIUser.body` |
| Single pensioner's benefit (200 €, 992 €) | `futureMe.help.household.body` |
| Care home (1 600 €, own shares) | `futureMe.help.careHome.body` |
| Life expectancy at 65 (21,4 and 16,3 years) | `futureMe.fundPensionFaq.when.a`, `futureMe.help.sex.body` |
| Pension ages 2027–2029 | `futureMe.help.pensionAge.body` |
| Inflation (2%) | `futureMe.you.intro`, `futureMe.help.nominal.body`, `futureMe.fundPensionFaq.when.a` and other `futureMe.help.*` |
| Deposit (−1%) | `futureMe.result.surplus` |
| "kontrollitud" dates | `futureMe.age65.faq.yearScore.a`, `futureMe.fundPensionFaq.at60.a` and 9 `futureMe.help.*.body` keys |

## How to update a value

1. **Test first.** Change the expected value in the test that pins it (`engine/yearlyValues.test.ts`,
   `engine/pensionRules.test.ts`, `engine/lifeTable.test.ts`, or the 2027–2029 test in `engine/pension.test.ts`), and
   see it fail.
2. **Code.** Add the new year's row, or change the value and the source comment above it.
3. **Copy.** Change every key that repeats the number with `scripts/edit-translation.py`, in both `et` and `en`, and
   move the "kontrollitud" date.
4. **Run the futureMe tests.** The tests run on a fixed date, so a new year's row only shows up in them once the tests'
   date moves too. The golden test and the screen tests that assert euro amounts will fail when a value they use
   changes: check that each changed number follows from the value you changed, then update them. There is no script to
   write `golden.json` again yet (see [README.md](README.md#open-questions)).
5. **Pull request:** the source and its date in the description.
