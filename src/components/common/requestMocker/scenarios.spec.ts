import moment from 'moment';
import sumBy from 'lodash/sumBy';
import { mockScenarios } from './scenarios';
import { mockModeProfiles } from './profiles';
import { MockModeConfiguration, MockModeEndpoint } from './types';
import { Fund, ReceivedGift, Role, SourceFund, Transaction, User } from '../apiModels';
import { isMinorActingAsSelf } from '../utils';

const profileIn = <T>(scenario: Partial<MockModeConfiguration>, endpoint: MockModeEndpoint): T =>
  mockModeProfiles[endpoint][scenario[endpoint] as string] as T;

describe('mock scenarios', () => {
  it.each(Object.entries(mockScenarios))('%s only uses profiles that exist', (_name, scenario) => {
    Object.entries(scenario).forEach(([endpoint, profile]) => {
      expect(Object.keys(mockModeProfiles[endpoint as MockModeEndpoint])).toContain(profile);
    });
  });

  describe('MINOR_SELF_VIEW', () => {
    const scenario = mockScenarios.MINOR_SELF_VIEW;
    const user = () => profileIn<User>(scenario, 'user');
    const transactions = () => profileIn<Transaction[]>(scenario, 'transactions');
    const savingsFundBalance = () => profileIn<SourceFund>(scenario, 'savingsFundBalance');

    it('logs in Mari Maasikas, 12, looking at her own account', () => {
      expect(user()).toMatchObject({ firstName: 'Mari', lastName: 'Maasikas', age: 12 });
      expect(isMinorActingAsSelf(user())).toBe(true);
    });

    it('gives her an age that matches her date of birth', () => {
      expect(moment().diff(user().dateOfBirth, 'years')).toBe(user().age);
    });

    describe('years from now', () => {
      let userYearsFromNow: User;

      beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2033-06-01T12:00:00Z'));
        jest.isolateModules(() => {
          // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
          const { userMockProfiles } = require('./profiles/user');
          userYearsFromNow = userMockProfiles.MINOR;
        });
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it('keeps her a 12-year-old whose age matches her date of birth', () => {
        expect(userYearsFromNow.age).toBe(12);
        expect(moment().diff(userYearsFromNow.dateOfBirth, 'years')).toBe(12);
        expect(isMinorActingAsSelf(userYearsFromNow)).toBe(true);
      });
    });

    it('offers her no other account to switch to', () => {
      expect(profileIn<Role[]>(scenario, 'roles')).toEqual([user().role]);
    });

    it('has her savings fund deposits add up to what went into the fund', () => {
      expect(sumBy(transactions(), 'amount')).toBeCloseTo(savingsFundBalance().contributions);
      expect(savingsFundBalance().price - savingsFundBalance().contributions).toBeCloseTo(
        savingsFundBalance().profit,
      );
    });

    it('has one deposit from her own bank account, one gift and the rest from her parent', () => {
      const fromOwnAccount = transactions().filter(({ paidFromOwnAccount }) => paidFromOwnAccount);
      const fromParent = transactions().filter(({ remitterName }) => remitterName === 'Kati Kask');
      const gifts = profileIn<ReceivedGift[]>(scenario, 'myGifts');

      expect(fromOwnAccount).toHaveLength(1);
      expect(gifts).toHaveLength(1);
      expect(transactions()).toContainEqual(
        expect.objectContaining({ remitterName: gifts[0].giverName, amount: gifts[0].amount }),
      );
      expect(fromParent).toHaveLength(transactions().length - 2);
    });

    it('holds a III pillar fund', () => {
      expect(profileIn<SourceFund[]>(scenario, 'sourceFunds').map(({ pillar }) => pillar)).toEqual([
        3,
      ]);
    });

    it('knows the savings fund her transactions are in', () => {
      const fundIsins = profileIn<Fund[]>(scenario, 'funds').map(({ isin }) => isin);
      transactions().forEach(({ isin }) => expect(fundIsins).toContain(isin));
    });
  });
});
