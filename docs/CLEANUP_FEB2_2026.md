# Cleanup Plan: Remove Savings Fund Feature Flag (Feb 2, 2026)

## Background
Withdrawal and cancellation features were temporarily disabled for the savings fund initial offer period. The feature flag `isSavingsFundWithdrawalEnabled()` auto-enables on Feb 1, 2026.

## Cleanup Tasks

After Feb 1, 2026, remove the feature flag and simplify the code:

### 1. Delete Feature Flag Utility
**File**: `src/components/common/featureFlags.ts`
- Delete the entire file

### 2. Simplify AccountPage.jsx
**File**: `src/components/account/AccountPage.jsx`

Remove import:
```diff
- import { isSavingsFundWithdrawalEnabled } from '../common/featureFlags';
```

Simplify withdraw link (remove conditional):
```diff
- {isSavingsFundWithdrawalEnabled() && (
-   <Link to="/savings-fund/withdraw">
-     <FormattedMessage id="accountStatement.savingsFund.withdraw" />
-   </Link>
- )}
+ <Link to="/savings-fund/withdraw">
+   <FormattedMessage id="accountStatement.savingsFund.withdraw" />
+ </Link>
```

### 3. Simplify ApplicationCards.tsx
**File**: `src/components/account/ApplicationSection/ApplicationCards.tsx`

Remove import:
```diff
- import { isSavingsFundWithdrawalEnabled } from '../../common/featureFlags';
```

Remove feature flag check from `isCancellationAllowed` function:
```diff
- // Disable cancellations for savings fund types until feature is enabled
- if (isSavingsFundType && !isSavingsFundWithdrawalEnabled()) {
-   return false;
- }
```

Remove feature flag check and min date logic from `getDescription` in `SavingsFundApplicationCard`:
```diff
- if (!isSavingsFundWithdrawalEnabled()) {
-   return undefined;
- }
-
- const minFulfillmentDate = '2026-02-02';
- const fulfillmentDate =
-   application.details.fulfillmentDeadline < minFulfillmentDate
-     ? minFulfillmentDate
-     : application.details.fulfillmentDeadline;
-
  return (
    <FormattedMessage
      id="applications.type.savingFundPayment.fulfillmentNotice"
      values={{
-       fulfillmentDeadline: formatShortDate(fulfillmentDate),
+       fulfillmentDeadline: formatShortDate(application.details.fulfillmentDeadline),
      }}
    />
  );
```

### 4. Simplify SavingsFundPaymentSuccess.tsx
**File**: `src/components/flows/savingsAccount/SavingsFundPayment/SavingsFundPaymentSuccess.tsx`

Remove import:
```diff
- import { isSavingsFundWithdrawalEnabled } from '../../../common/featureFlags';
```

Remove conditional description logic:
```diff
- const descriptionKey = isSavingsFundWithdrawalEnabled()
-   ? 'savingsFund.payment.success.description'
-   : 'savingsFund.payment.success.description.initialOffer';
...
- <FormattedMessage id={descriptionKey} />
+ <FormattedMessage id="savingsFund.payment.success.description" />
```

### 5. Remove Initial Offer Translation Keys
**Files**: `src/components/translations/translations.et.json`, `translations.en.json`

Remove:
```diff
- "savingsFund.payment.success.description.initialOffer": "..."
```

### 6. Restore ApplicationSection Test
**File**: `src/components/account/ApplicationSection/ApplicationSection.test.tsx`

Uncomment the fulfillment notice assertion in `renders correct fields for savings fund payment application` test:
```diff
- // TODO: Uncomment after Feb 1, 2026 cleanup (see docs/CLEANUP_FEB2_2026.md)
- // expect(
- //   screen.getByText('The deposit amount will be invested in the fund 02/01/2024'),
- // ).toBeInTheDocument();
+ expect(
+   screen.getByText('The deposit amount will be invested in the fund 02/01/2024'),
+ ).toBeInTheDocument();
```

## Verification
1. Run `npm test` - all tests should pass
2. Manually verify withdraw link appears on account page
3. Manually verify cancel buttons appear on pending payments/withdrawals
