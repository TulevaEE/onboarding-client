# Tulevane Mina: periodic review

None of the values below come from an API. They are written into the code, the data files or the copy, and they go out
of date on a known schedule or when a law changes. Check them on the schedule below, and update them as described in
[How to update a value](#how-to-update-a-value).

All values are as of the 2026 checks (sources checked 26.10.2026). Paths are relative to `src/components/futureMe/`.
Copy keys are in `src/components/translations/translations.{et,en}.json`; both files hold the Estonian text for
`futureMe.*`.

## Every January: new year and state budget

| Value | Now | Code | Copy that repeats it | Source |
| --- | --- | --- | --- | --- |
| Calculation year | 2026 | `CURRENT_YEAR`, `engine/pension.ts`; the youngest birth year (`BIRTH_YEAR_MAX`, `prefill.ts`) follows it | – | – |
| Income tax | 22% | `INCOME_TAX`, `engine/pension.ts` | `futureMe.fundPensionFaq.when.a` | EMTA |
| Pensioner's tax-free income | 776 € a month | `PENSIONER_ALLOWANCE`, `engine/pension.ts` | – | EMTA |
| General tax-free income | 700 € a month | `GENERAL_ALLOWANCE`, `engine/pension.ts` | – | EMTA |

## Every April: indexation on 1 April

| Value | Now | Code | Copy that repeats it | Source |
| --- | --- | --- | --- | --- |
| Aastahinne (value of one year's pension unit) | 10,477 € from 1.04.2026 | `AASTAHINNE`, `engine/pension.ts` | `futureMe.age65.faq.yearScore.a`: 10,48 €, the examples 3,5 × 10,48 € ≈ 37 € and 2 × 10,48 € ≈ 21 €, the date and "kontrollitud" | SKA "Pensioni suurus"; the government's indexation order |
| Average old-age pension with 44 years of service | 860,23 € | `AVG_OLD_AGE_PENSION`, `engine/pension.ts` | – | Vabariigi Valitsus, SKA |
| Minimum wage | 946 € from 1.04.2026 | `MIN_WAGE`, `engine/pension.ts` | – | Government regulation on the minimum wage |

## Every year, when Statistikaamet publishes

| Value | Now | Code | Copy that repeats it | Source |
| --- | --- | --- | --- | --- |
| Average gross monthly wage | 2 092 € (2025) | `AVG_WAGE`, `engine/pension.ts` | – | Statistikaamet PA103 |
| Life expectancy at 65, by year (sets the pension age) | 2018–2025 | `LIFE_EXP_65`, `engine/pension.ts`: add the new year | – | Statistikaamet RV045 |
| Life table: survivors and remaining years by age and sex | 2025 | `engine/lifeTable.json` | `futureMe.fundPensionFaq.when.a`: 21,4 and 16,3 years, ages 86 and 81, "iga kümnes" 97 and 93 | Statistikaamet RV045, RV046 |
| Cost levels by household | survey year 2020, prices as of 2026-09, price factor 1,547 | `engine/expenses.json`: `studyYear`, `pricesAsOf`, `priceFactor`, `categories` | `futureMe.expenses.source.text` takes the numbers from the file | Statistikaamet household budget survey and consumer price index (the prototype used LE205, LE211, IA002) |

`lifeTable.json` and `expenses.json` were generated outside this repository. How to generate them again is an open
question in [README.md](README.md#open-questions).

## September–October: SKA publishes next year's amounts

| Value | Now | Code | Copy that repeats it | Source |
| --- | --- | --- | --- | --- |
| State II pillar payment for a child under 3 | 2026: 76,12 €, 2027: 80,76 € a month | `CHILD_II_MONTHLY`, `engine/pension.ts`: add the next year | – | SKA "Perehüvitiste määrad ja maksmine" |
| Flexible pension: increase per year deferred | +7,93% (1 a) … +51,57% (5 a) | `DEFERRAL_INCREASE`, `engine/pension.ts` | The decision card text in `decisionMap`, `engine/pension.ts` ("+7,93% (1 a) kuni +51,57% (5 a), 2026 keskmised") | SKA "Paindlik vanaduspension", SKA pension calculator |
| Flexible pension: decrease per year early | −7,17% (1 a) … −30,67% (5 a) | `EARLY_DECREASE`, `engine/pension.ts` | – | Same |
| Single pensioner's benefit | 200 € a year, pension under 992 € a month | not calculated | `futureMe.expenses.household.help.benefit` (200 €, 992 €, 2026, u 17 € kuus), `futureMe.expenses.household.help.source` ("kontrollitud") | SKA "Üksi elava pensionäri toetus", minister of social affairs' regulation |
| Care home own share | about 1 000 € a month | `CARE_HOME_SHARE`, `engine/expenses.ts` | `futureMe.expenses.level.alt.careHome` takes the number from the code | SKA, ERR |
| Last pension age set by regulation | 2029 (65 a 4 k) | `known = year <= 2029` in `pensionAge`, `engine/pension.ts`; the test "uses the pension ages set for 2027 to 2029" in `engine/pension.test.ts` | The pension age label shows "u" before a year that is not set yet | Minister's regulation, two years ahead (RPKS § 7) |

## Tuleva's own assumptions: when Tuleva changes them

| Value | Now | Code | Copy that repeats it |
| --- | --- | --- | --- |
| Wage growth | 3% a year | `WAGE_GROWTH`, `engine/pension.ts` | – |
| Inflation | 2% a year | `INFLATION`, `engine/pension.ts` | `futureMe.you.intro` ("2% aastas") |
| Fund returns to choose from | 0%, 2%, 4% after inflation | `FUND_RETURNS`, `youAnswers.ts` | `futureMe.you.fund.*` take the numbers from the code |
| Deposit return after inflation | −1% a year | default `depositReturn` in `simulate`, `engine/pension.ts` | `futureMe.fundPensionFaq.when.a` (with the example 3%, 2,3%, 3,3%), `futureMe.result.surplus` |
| Prices in "what a level buys" | fuel tank 80 €, beef 10 €/kg, trip 1 800 €, café lunch 12 € | `PRICE`, `engine/expenses.ts` | – |

## When a law changes

Read the new consolidated text in Riigi Teataja when it is published. The 2027-01-01 text of the funded pensions act
(KoPS) has not been read yet.

| Rule | Now | Code | Copy that repeats it | Law |
| --- | --- | --- | --- | --- |
| Tax on a lump sum or a short fund pension | 10% | `TAX_SHORT`, `engine/pension.ts` | Many `futureMe.age55.*`, `age60.*`, `age65.*`, `age66.*` texts ("10% tulumaks") | TuMS § 21 |
| III pillar favourable age | 55 if joined before 2021, else 5 years before the pension age | `thirdPillarPayoutAges.ts`, `decisionMap` | `futureMe.age55.*`, `futureMe.you.thirdPillarJoined.*` | KoPS § 63 lg 3, § 72⁷ |
| II pillar payouts open | 5 years before the pension age | `YEARS_BEFORE_PENSION_AGE`, `planAges.ts`; `steps.ts` | `futureMe.fundPensionFaq.at60.a` | KoPS |
| State II pillar contribution | 4% | `STATE_SECOND_PILLAR_RATE`, `specialPensionAnswers.ts` | `futureMe.age60.workTip`, `futureMe.specialPension.work.*` | KoPS, sotsiaalmaksuseadus |
| Children's pension supplement | 3,5 aastahinnet a child | `childSupplement`, `engine/pension.ts` | `futureMe.age65.faq.yearScore.a` | RPKS § 24 lg 1¹, § 28 lg 2 p 12 |
| Hazardous work | 0,031 and 0,219 aastahinnet a year; 10 or 12,5 years needed, 20 or 25 years of service | `hazardSupplement`, `engine/pension.ts`; `HAZARD_YEARS_NEEDED`, `SERVICE_YEARS_NEEDED`, `YouOptionalBlocks.tsx` | – | SVPS § 1, § 3 |
| Rescue and civil service increase | 10% … 50% by years of service; rescue until 28.02.2043 | `rescueIncrease`, `RESCUE_LAST_YEAR`, `engine/pension.ts` | `futureMe.you.work.civil`, `futureMe.you.work.civilNote` | PäästeTS § 18, ATS § 113 |
| Special pension of the defence forces and police | 50% of the salary for 20 years, +2,5% a year, up to 75% | not calculated | `futureMe.specialPension.monthly.hint` | Not recorded yet |

## How to update a value

1. **Test first.** Change the expected value in the test that pins it, usually `engine/pensionRules.test.ts`
   (`lifeTable.test.ts` for the life table, `pension.test.ts` for the pension ages), and see it fail.
2. **Code.** Change the value and the source comment above it (year and date).
3. **Copy.** Change every key in the "Copy that repeats it" column with `scripts/edit-translation.py`, in both `et` and
   `en`, and move the "kontrollitud" date.
4. **Run the futureMe tests.** The golden test and the screen tests that assert euro amounts will fail. Check that each
   changed number follows from the value you changed, then update them. There is no script to write `golden.json`
   again yet (see [README.md](README.md#open-questions)).
5. **Pull request:** the source and its date in the description, and before and after screenshots of the changed
   screens, as the repository's `CLAUDE.md` asks.
