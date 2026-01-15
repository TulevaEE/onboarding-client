# Cleanup Plan: Remove Savings Fund Feature Flag (Feb 2, 2025)

## Background
Withdrawal and cancellation features were temporarily disabled for the savings fund initial offer period. The feature flag `isSavingsFundWithdrawalEnabled()` auto-enables on Feb 1, 2025.

## Cleanup Tasks

After Feb 1, 2025, remove the feature flag and simplify the code:

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

## Verification
1. Run `npm test` - all tests should pass
2. Manually verify withdraw link appears on account page
3. Manually verify cancel buttons appear on pending payments/withdrawals
