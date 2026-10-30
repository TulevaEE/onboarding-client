# Tulevane Mina (`/future-me`)

A step-by-step life path planner: the saver answers questions about themselves and their choices at 55, before the
pension age, at the pension age and after it, picks a cost level, and the result step shows year by year whether their
income covers their costs until 100.

It is a port of the Tulevane Mina prototype's life path (`mirxz/tulevane-mina` at `b1adbcf`, `public/elukaar/`). The
engine started as the prototype's logic unchanged; the changes since then are in the pull requests titled
"Tulevane Mina".

Values that change every year or with the law, and how to update them: [PERIODIC_REVIEW.md](PERIODIC_REVIEW.md).

## How it fits into the app

- **Route:** `/future-me` in `src/components/LoggedInApp/LoggedInApp.js`.
- **Boundary:** the rest of the app may import only `futureMe/FutureMe`; `.eslintrc.js` enforces it. Tulevane Mina is
  not connected to the existing `pensionCalculator`.
- **Data in** ([FutureMe.tsx](FutureMe.tsx), [prefill.ts](prefill.ts), [kidsPrefill.ts](kidsPrefill.ts)):
  - `useMe`: birth year and month, sex, II pillar payment rate, when the saver joined the III pillar.
  - `useContributions`: gross salary and the III pillar monthly payment.
  - `useSourceFunds`: the II and III pillar amounts.
  - `useFundPensionStatus`: fund pensions that have already started ([startedFundPensions.ts](startedFundPensions.ts)).
  - `useRoles`, `usePendingOnboardings`: the saver's children who are Tuleva members.

  Every prefilled answer can be changed; everything else the saver types in.
- **Data stored:** nothing on the server. Answers live in React state and are gone after a reload. The saver can
  download the result as Markdown or PDF ([ResultSave.tsx](ResultSave.tsx)).
- **Data out:**
  - Google Analytics event `future_me_step` with the step number only ([tracking.ts](tracking.ts)).
  - The feedback box on the result step sends the comment, with personal data removed by `redactPii`, as a tracked
    event ([ResultFeedback.tsx](ResultFeedback.tsx)).

## Steps

[steps.ts](steps.ts) holds the step order and decides which steps a saver sees (`shownSteps`).

| Step (`FutureMeStep`) | Components | Answers (pure functions) | Shown when |
| --- | --- | --- | --- |
| `YOU` | `YouStep`, `YouBlocks`, `YouFields`, `YouOptionalBlocks`, `YouSection`, `YouFaq` | `youAnswers.ts`, `prefill.ts`, `kidsPrefill.ts`, `kidsInput.ts` | Always |
| `AGE_55` | `Age55Step` | `age55.ts` | The saver joined the III pillar before 2021 |
| `AGE_60` | `Age60Step` | `age60Answers.ts` | Always |
| `AGE_65` | `Age65Step`, `Age65Deferral`, `Age65Pillars`, `Age65Work`, `FirstPillarChoice` | `age65Answers.ts` | Always |
| `AGE_66_PLUS` | `Age66Step`, `Age66Pillar`, `ContractChoices` | `age66Answers.ts`, `age66Needed.ts` | A choice is left after the pension age (`isAge66StepNeeded`) |
| `COSTS` | `ExpensesStep`, `ExpensesBreakdown` | `expensesAnswers.ts` | Always |
| `SPECIAL_PENSION` | `SpecialPensionStep` | `specialPensionAnswers.ts` | The saver has a special pension; placed by its start age |
| `RESULT` | `ResultStep`, `ResultChart*`, `ResultDecisions`, `ResultAdvice`, `ResultAssumptions`, `ResultRules`, `ResultLegacy`, `ResultNominalChoice`, `ResultSave`, `ResultFeedback` | `resultAnswers.ts`, `decisions.ts`, `payoutAdvice.ts`, `assumptions.ts`, `rules.ts`, `legacy.ts`, `nominal.ts`, `chart*.ts`, `resultMarkdown.ts` | Always |

Shared pieces: `StepTrail`, `stepLabels.ts`, `ChapterHead`, `StepSection`, `ChoiceCard`, `ChoiceMadeNote`,
`QuickEditSteps`, `PayoutChoiceText`, `FundPensionFaq`, `KidsCompareFaq` (`kidsCompare.ts`), `EarlyRetirementFields`,
the help dialog (`HelpButton`, `HelpIcon`, `helpTopics.ts`, `helpLinks.ts`, `helpRichText.tsx`), `FutureMeIcon`,
`LinkButton`, `richText.tsx`, `amountFormat.ts`, `planAges.ts`, `thirdPillarPayoutAges.ts`.

Copy lives in `src/components/translations/translations.{et,en}.json` under `futureMe.*`. Edit it only with
`scripts/edit-translation.py`, see the repository's `CLAUDE.md`.

### Step names are historical, not ages

The step ids, component names and copy keys come from the prototype, where each step was named after the age a typical
saver makes that decision. They name the decision point, not the age the saver sees.

| Step | Decision | Age shown |
| --- | --- | --- |
| `AGE_55` | III pillar at the lower tax: keep it growing, start a fund pension or take it all at once | Always 55: `THIRD_PILLAR_PAYOUT_AGE_JOINED_BEFORE_2021` |
| `AGE_60` | II pillar payouts at the lower tax start, and the III pillar choice if it is open by then | `payoutAge(plan)`: the pension age − 5 |
| `AGE_65` | Going on pension: the state pension in full, half or deferred, working on, the pillar choices | `retirementAge(plan)`: the pension age, or earlier with a flexible pension or on favourable terms |
| `AGE_66_PLUS` | Life after the pension age: when each fund pension starts and with which contract | `retirementAge(plan)` and onwards ("{age}+ a") |

The pension age is `retirementYears(plan)` in `engine/pension.ts`: the age the saver chose, or the legal pension age
for their birth year. The trail labels (`stepLabel`) and the kickers above the step headings show these ages. When the
66+ step is not shown, the pension age step's label becomes "{age}+ a". `AGE_65` comes before `AGE_60` when the saver
retires more than 5 years before the pension age (`stepOrder`).

The names stay because the saver never sees them. Renaming only the pension age step touches the 93 `futureMe.age65.*`
keys in each translation file and 57 source and test files; all four age steps touch 74 files. If the team wants
clearer names, rename them in a refactoring pull request of its own, for example `AGE_65` → `PENSION_AGE`.

## Where the logic is

The engine is in [engine/](engine/). It has no React and no API calls.

| Logic | Where | Law or source |
| --- | --- | --- |
| Year-by-year simulation: incomes, taxes, fund payouts, deposit, shortfall | `simulate` in `pension.ts` | RPKS, KoPS, TuMS |
| Payout routes compared on the result step | `SCENARIOS`, `options`, `bestDeferral` | – |
| Highest monthly need the plan can carry | `sustainableNeed` | – |
| Decision cards (when each choice opens) | `decisionMap` | KoPS § 63, TuMS § 21 |
| Yearly values (taxes, aastahinne, average pension, minimum wage) | `*_BY_YEAR` tables, `valueIn`, `missingYearlyValues` | EMTA, SKA, Vabariigi Valitsus |
| State pension accrual while working | `workAccrual` | RPKS § 12, § 13¹ |
| Pension age by birth year | `pensionAgeMonthsIn`, `pensionAge`, data in `LIFE_EXP_65` | RPKS § 7, § 7¹ |
| Flexible pension, deferred or early | `DEFERRAL_INCREASE`, `EARLY_DECREASE` | RPKS § 9¹, § 11¹ |
| Early retirement on favourable terms | `earlyYears` | RPKS § 10, SVPS § 1, PäästeTS § 19 |
| Children: pension supplement and state II pillar payment | `childSupplement`, `childPillar2`, `CHILD_II_MONTHLY` | RPKS § 24, § 28, KoPS § 10 |
| Hazardous work | `hazardSupplement` | SVPS § 3 |
| Civil and rescue service increase | `civilIncrease`, `rescueIncrease` | ATS § 113, PäästeTS § 18 |
| Survival, life horizon, fund pension term | `survival`, `horizonAge`, `fundPensionTerm`, data in `lifeTable.json` | Statistikaamet |
| Cost levels, what a level buys, care home comparison | `expenses.ts`, data in `expenses.json` | Statistikaamet household budget survey |
| Future prices instead of today's euros | `nominal.ts` (outside the engine) | `INFLATION` |

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

Run them as the repository's `CLAUDE.md` says, with `--testPathPattern=futureMe`. The calculation year comes from
today's date, so the Tulevane Mina tests fix the date (15 October 2026).

- **Golden:** [engine/pension.test.ts](engine/pension.test.ts) runs the saver profiles in
  [goldenProfiles.json](engine/goldenProfiles.json) through every scenario and compares them with
  [golden.json](engine/golden.json), which the prototype produced. There is no script in this repository that writes
  `golden.json` again.
- **Rules and yearly values:** [engine/pensionRules.test.ts](engine/pensionRules.test.ts) and
  [engine/yearlyValues.test.ts](engine/yearlyValues.test.ts) pin the yearly constants.
- **Outside references:** `socialInsuranceBoardCalculator.test.ts` (SKA's pension calculator),
  `pensionCalculatorComparison.test.ts` (Tuleva's own calculator), `lifeTable.test.ts` (Statistikaamet 2025).
- **Engine behaviour:** the other `engine/*.test.ts` files.
- **Screens:** `*Step.test.tsx`, `Result*.test.tsx` and the answer tests. Many of them assert euro amounts, so a yearly
  update changes them too.

To see the page with test data, open it with `?dev` and pick mock profiles
([requestMocker/README.md](../common/requestMocker/README.md)).

## Decided not to port

- **The prototype's 0–18, 18 and 18–55 steps**, including early withdrawal from the II and III pillar before the pension
  age. The engine still supports an early II pillar withdrawal (`secondPillarEarlyWithdrawal.test.ts`).
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
  meantime, with their own numbers.
