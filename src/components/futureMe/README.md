# Tulevane Mina (`/future-me`)

A step-by-step life path planner: the saver answers questions about themselves and their choices at 55, 60, the
pension age and after, picks a cost level, and the result step shows year by year whether their income covers their
costs until 100.

It is a port of the Tulevane Mina prototype's life path (`mirxz/tulevane-mina` at `b1adbcf`, `public/elukaar/`). The
engine logic is unchanged from the prototype, with one deliberate change: the civil or rescue service increase also
applies to the half state pension, as it does to the full one.

Values that change every year or with the law, and how to update them: [PERIODIC_REVIEW.md](PERIODIC_REVIEW.md).

## How it fits into the app

- **Route:** `/future-me` in `src/components/LoggedInApp/LoggedInApp.js`.
- **Boundary:** the rest of the app may import only `futureMe/FutureMe`; `.eslintrc.js` enforces it. Tulevane Mina is
  not connected to the existing `pensionCalculator`.
- **Data in:** only `useMe()`, through [prefill.ts](prefill.ts): birth year from the date of birth, sex from the
  first digit of the personal code, the II pillar payment rate, and whether the saver joined the III pillar before or
  after 2021. Everything else the saver types in.
- **Data stored:** nothing. Answers live in React state in [FutureMe.tsx](FutureMe.tsx) and are gone after a reload.
- **Data out:** one Google Analytics event, `future_me_samm`, with the step number only ([tracking.ts](tracking.ts)).

## Steps

[steps.ts](steps.ts) holds the step order and decides which steps a saver sees (`shownSteps`), from their birth year,
pension age, early retirement and special pension.

| Step | Component | Answers (pure functions) |
| --- | --- | --- |
| You | `YouStep`, `YouBlocks`, `YouFields`, `YouOptionalBlocks`, `YouSection` | `youAnswers.ts`, `prefill.ts` |
| 18–55 early withdrawal | `PlaceholderStep` (not ported, see below) | – |
| 55 (III pillar, joined before 2021) | `Age55Step` | `age55.ts` |
| 60 (II and III pillar payouts) | `Age60Step` | `age60Answers.ts` |
| Pension age | `Age65Step`, `Age65Deferral`, `Age65Pillars`, `Age65Work`, `FirstPillarChoice` | `age65Answers.ts` |
| 66+ (fund pension start and contract) | `Age66Step`, `Age66Pillar` | `age66Answers.ts` |
| Costs | `ExpensesStep`, `ExpensesBreakdown` | `expensesAnswers.ts` |
| Special pension (placed by age) | `SpecialPensionStep` | `specialPensionAnswers.ts` |
| Result | `ResultStep`, `ResultChart`, `ResultChartTip`, `ResultAdvice` | `resultAnswers.ts`, `payoutAdvice.ts`, `chart*.ts` |

Shared pieces: `StepTrail`, `ChapterHead`, `ChoiceCard`, `LinkButton`, `FutureMeIcon`, `FundPensionFaq`,
`EarlyRetirementFields`, `richText.tsx`, `amountFormat.ts`, `planAges.ts`, `thirdPillarPayoutAges.ts`,
`stepLabels.ts`.

Copy lives in `src/components/translations/translations.{et,en}.json` under `futureMe.*`. Edit it only with
`scripts/edit-translation.py`, see the repository's `CLAUDE.md`.

## Where the logic is

The engine is in [engine/](engine/). It has no React and no API calls.

| Logic | Where | Law or source |
| --- | --- | --- |
| Year-by-year simulation: incomes, taxes, fund payouts, deposit, shortfall | `simulate` in `pension.ts` | RPKS, KoPS, TuMS |
| Payout routes compared on the result step | `SCENARIOS`, `options`, `bestDeferral` | – |
| Highest monthly need the plan can carry | `sustainableNeed` | – |
| Decision cards (when each choice opens) | `decisionMap` | KoPS § 63, TuMS § 21 |
| State pension accrual while working | `workAccrual` | RPKS § 12, § 13¹ |
| Pension age by birth year | `pensionAgeMonthsIn`, `pensionAge`, data in `LIFE_EXP_65` | RPKS § 7, § 7¹ |
| Flexible pension, deferred or early | `DEFERRAL_INCREASE`, `EARLY_DECREASE` | RPKS § 9¹, § 11¹ |
| Early retirement on favourable terms | `earlyYears` | RPKS § 10, SVPS § 1, PäästeTS § 19 |
| Children: pension supplement and state II pillar payment | `childSupplement`, `childPillar2`, `CHILD_II_MONTHLY` | RPKS § 24, § 28, KoPS § 10 |
| Hazardous work | `hazardSupplement` | SVPS § 3 |
| Civil and rescue service increase | `civilIncrease`, `rescueIncrease` | ATS § 113, PäästeTS § 18 |
| Survival, life horizon, fund pension term | `survival`, `horizonAge`, `fundPensionTerm`, data in `lifeTable.json` | Statistikaamet |
| Cost levels and what a level buys | `expenses.ts`, data in `expenses.json` | Statistikaamet household budget survey |

## How costs are covered: the deposit assumption

Every year from the retirement age, `simulate` covers the saver's costs in this order:

1. The state pension, the special pension and the fund pension payouts the saver chose.
2. **The deposit.** Pillar money taken out in one go, and any year's surplus, goes to the deposit and is spent later
   when costs are higher than income. After the retirement age the deposit loses 1% a year after inflation
   (`DEPOSIT_REAL_RETURN`).
3. **The II pillar, then the III pillar, as withdrawals with 10% income tax**, once they are open, when the saver has
   not chosen a fund pension yet or chose to start it later.

So the cost cover in the chart comes from the deposit and the funds too, not only from pensions. Both are large
assumptions: that a saver who takes pillar money out keeps it on a deposit for later, and that a saver who left the
money growing takes out exactly what is missing each year.

## Tests

Run them as the repository's `CLAUDE.md` says, with `--testPathPattern=futureMe`.

- **Golden:** [engine/pension.test.ts](engine/pension.test.ts) runs 13 saver profiles
  ([goldenProfiles.json](engine/goldenProfiles.json)) through every scenario and compares them with
  [golden.json](engine/golden.json), which the prototype produced. There is no script in this repository that writes
  `golden.json` again.
- **Rules:** [engine/pensionRules.test.ts](engine/pensionRules.test.ts) pins the yearly constants. When a yearly value
  changes, this test changes with it.
- **Outside references:** `socialInsuranceBoardCalculator.test.ts` (SKA's pension calculator),
  `pensionCalculatorComparison.test.ts` (Tuleva's own calculator), `lifeTable.test.ts` (Statistikaamet 2025).
- **Engine behaviour:** the other `engine/*.test.ts` files are the prototype's own engine tests, ported assertion for
  assertion.
- **Screens:** `*Step.test.tsx` and the answer tests. Many of them assert euro amounts, so a yearly update changes them
  too.

To see the page with test data, open it with `?dev` and pick mock profiles
([requestMocker/README.md](../common/requestMocker/README.md)).

## Decided not to port

- **18–55 early withdrawal step** (II pillar taken out before the pension age, rejoining, III pillar before the
  favourable age). The step shows a placeholder. The engine still supports it (`secondPillarEarlyWithdrawal.test.ts`).
- **The prototype's other parts:** the voice call game, its Cloudflare Worker and the feedback database.

## Open questions

- Who does the periodic review in [PERIODIC_REVIEW.md](PERIODIC_REVIEW.md), and when.
- How `golden.json` is written again after a yearly update: no script in this repository.
- How `lifeTable.json` and `expenses.json` are generated again: the generators are outside this repository.
- The pension ages for 2027–2029 come from the RPKS § 7 formula; they have not been checked against the minister's
  regulation yet.

## Possible later work

- **Splitting rights between parents.** Parents can also split the up to 5 years of early retirement they get for
  their children. For now the calculator gives the early retirement to one parent, and the "?" help text explains the
  split; the split itself may be calculated later. The same question may affect the rescue worker's benefit and some
  special pensions; this has not been checked against the law yet.
- **Changing the deposit assumption, if needed.** One option: money left growing stays in the fund and is not taken
  out to cover costs; the chart shows only the payouts the saver chose, and the result says what the grown fund is
  worth at the end. A first version of this change exists but is not merged.
- **Assets outside the pension system** (most asked for in user tests): savings and investments the saver has
  elsewhere, counted in the result and the chart.
- **A step from 18 to the pension age** (asked for by younger savers): what they plan to do with the pillars in the
  meantime, with their own numbers. The prototype's 18–55 step was not ported, see above.
