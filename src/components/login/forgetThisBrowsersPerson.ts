import { forgetRememberedMobileIdPerson, forgetRememberedSmartIdAccount } from '../common/api';

export const forgetThisBrowsersPerson = (): Promise<void> =>
  Promise.all(
    [forgetRememberedSmartIdAccount(), forgetRememberedMobileIdPerson()].map((forgetting) =>
      Promise.resolve(forgetting).catch(() => undefined),
    ),
  ).then(() => undefined);
