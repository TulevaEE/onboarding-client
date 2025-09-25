import { CapitalRow } from '../../../common/apiModels';
import {
  calculateTransferAmountInputsFromNewTotalBookValue,
  calculateClampedTransferAmountsAndPrices,
  filterZeroBookValueAmounts,
  getMemberCapitalSums,
  isLiquidatableCapitalType,
  floorValuesToSecondDecimal,
} from './utils';

describe('isLiquidatableCapitalType', () => {
  it.each([
    ['CAPITAL_PAYMENT'],
    ['WORK_COMPENSATION'],
    ['CAPITAL_ACQUIRED'],
    ['MEMBERSHIP_BONUS'],
  ] as const)('capital type %s should be liquidatable', (type) =>
    expect(isLiquidatableCapitalType(type)).toBe(true),
  );
});

describe('getMemberCapitalSums', () => {
  it('should sum values', () => {
    const rows: CapitalRow[] = [
      {
        type: 'CAPITAL_PAYMENT',
        contributions: 1000.0,
        profit: -123.45,
        value: 1000.0 - 123.45,
        currency: 'EUR',
        unitPrice: (1000 - 123.45) / 1000,
        unitCount: 1000,
      },
      {
        type: 'UNVESTED_WORK_COMPENSATION',
        contributions: 0,
        profit: 0,
        value: 0,
        currency: 'EUR',
        unitCount: 0,
        unitPrice: (1000 - 123.45) / 1000,
      },
      {
        type: 'WORK_COMPENSATION',
        contributions: 0,
        profit: 0,
        value: 0,
        unitCount: 0,
        unitPrice: 1.23,
        currency: 'EUR',
      },
      {
        type: 'MEMBERSHIP_BONUS',
        contributions: 1.23,
        profit: 0,
        value: 1.23,
        currency: 'EUR',
        unitPrice: 1.23,
        unitCount: 1,
      },
    ];

    expect(getMemberCapitalSums(rows)).toStrictEqual({ unitAmount: 1001, bookValue: 877.78 });
  });
});

describe('calculateTransferAmountInputsFromNewTotalBookValue', () => {
  const rows: CapitalRow[] = [
    {
      type: 'UNVESTED_WORK_COMPENSATION',
      contributions: 0,
      profit: 0,
      value: 4000,
      currency: 'EUR',
      unitCount: 0,
      unitPrice: 0,
    },
    {
      type: 'CAPITAL_PAYMENT',
      contributions: 0,
      profit: 0,
      value: 2000.0,
      currency: 'EUR',
      unitPrice: 0,
      unitCount: 0,
    },
    {
      type: 'WORK_COMPENSATION',
      contributions: 0,
      profit: 0,
      value: 5000,
      unitCount: 0,
      unitPrice: 1.23,
      currency: 'EUR',
    },
    {
      type: 'MEMBERSHIP_BONUS',
      contributions: 0,
      profit: 0,
      value: 60,
      currency: 'EUR',
      unitPrice: 0,
      unitCount: 0,
    },
  ];

  it('should only take from CAPITAL_PAYMENT when sale amount is less than CAPITAL PAYMENT', () => {
    const [first, second, third] = calculateTransferAmountInputsFromNewTotalBookValue(500, rows);

    expect(first).toStrictEqual({
      type: 'CAPITAL_PAYMENT',
      bookValue: 500,
    });

    expect(second).toStrictEqual({
      type: 'WORK_COMPENSATION',
      bookValue: 0,
    });

    expect(third).toStrictEqual({
      type: 'MEMBERSHIP_BONUS',
      bookValue: 0,
    });
  });

  it('should take from others when sale amount is more than capital payment', () => {
    const [first, second, third] = calculateTransferAmountInputsFromNewTotalBookValue(7000, rows);

    expect(first).toStrictEqual({
      type: 'CAPITAL_PAYMENT',
      bookValue: 2000,
    });

    expect(second).toStrictEqual({
      type: 'WORK_COMPENSATION',
      bookValue: 5000,
    });

    expect(third).toStrictEqual({
      type: 'MEMBERSHIP_BONUS',
      bookValue: 0,
    });
  });

  it('should max out when sale amount is equal to max', () => {
    const [first, second, third] = calculateTransferAmountInputsFromNewTotalBookValue(7060, rows);
    expect(first).toStrictEqual({
      type: 'CAPITAL_PAYMENT',
      bookValue: 2000,
    });

    expect(second).toStrictEqual({
      type: 'WORK_COMPENSATION',
      bookValue: 5000,
    });

    expect(third).toStrictEqual({
      type: 'MEMBERSHIP_BONUS',
      bookValue: 60,
    });
  });

  it('should max out when sale amount is equal to max', () => {
    const [first, second, third] = calculateTransferAmountInputsFromNewTotalBookValue(7060, rows);
    expect(first).toStrictEqual({
      type: 'CAPITAL_PAYMENT',
      bookValue: 2000,
    });

    expect(second).toStrictEqual({
      type: 'WORK_COMPENSATION',
      bookValue: 5000,
    });

    expect(third).toStrictEqual({
      type: 'MEMBERSHIP_BONUS',
      bookValue: 60,
    });
  });

  it('should take from other categories according to liquidation preference', () => {
    const [first, second, third] = calculateTransferAmountInputsFromNewTotalBookValue(4000, [
      {
        type: 'UNVESTED_WORK_COMPENSATION',
        contributions: 0,
        profit: 0,
        value: 4000,
        currency: 'EUR',
        unitCount: 0,
        unitPrice: 0,
      },
      {
        type: 'CAPITAL_PAYMENT',
        contributions: 0,
        profit: 0,
        value: 0,
        currency: 'EUR',
        unitPrice: 0,
        unitCount: 0,
      },
      {
        type: 'WORK_COMPENSATION',
        contributions: 0,
        profit: 0,
        value: 5000,
        unitCount: 0,
        unitPrice: 1.23,
        currency: 'EUR',
      },
      {
        type: 'MEMBERSHIP_BONUS',
        contributions: 0,
        profit: 0,
        value: 60,
        currency: 'EUR',
        unitPrice: 0,
        unitCount: 0,
      },
    ]);
    expect(first).toStrictEqual({
      type: 'CAPITAL_PAYMENT',
      bookValue: 0,
    });

    expect(second).toStrictEqual({
      type: 'WORK_COMPENSATION',
      bookValue: 4000,
    });

    expect(third).toStrictEqual({
      type: 'MEMBERSHIP_BONUS',
      bookValue: 0,
    });
  });
});

describe('calculateClampedTransferAmountsAndPrices', () => {
  it('should calculate price proprtionally', () => {
    const [first, second] = calculateClampedTransferAmountsAndPrices(
      { totalPrice: 6000 },
      [],
      [
        { type: 'CAPITAL_PAYMENT', bookValue: 2000 },
        { type: 'WORK_COMPENSATION', bookValue: 1000 },
      ],
    );

    expect(first).toStrictEqual({
      type: 'CAPITAL_PAYMENT',
      bookValue: 2000,
      price: 4000,
    });

    expect(second).toStrictEqual({
      type: 'WORK_COMPENSATION',
      bookValue: 1000,
      price: 2000,
    });
  });

  it('should set amounts to second decimal if they are not close to maximum', () => {
    const [first, second] = calculateClampedTransferAmountsAndPrices(
      { totalPrice: 6000 },
      [
        {
          type: 'CAPITAL_PAYMENT',
          contributions: 1000.4596,
          profit: 0,
          value: 1000.4596,
          currency: 'EUR',
          unitPrice: 0,
          unitCount: 0,
        },
        {
          type: 'WORK_COMPENSATION',
          contributions: 2000.4412,
          profit: 0,
          value: 2000.4412,
          unitCount: 0,
          unitPrice: 0,
          currency: 'EUR',
        },
      ],
      [
        { type: 'CAPITAL_PAYMENT', bookValue: 800.4596 },
        { type: 'WORK_COMPENSATION', bookValue: 1000.4432 },
      ],
    );

    expect(first).toStrictEqual({
      type: 'CAPITAL_PAYMENT',
      bookValue: 800.45,
      price: 2666.86,
    });

    expect(second).toStrictEqual({
      type: 'WORK_COMPENSATION',
      bookValue: 1000.44,
      price: 3333.13,
    });
  });

  it('should use all of capital if amounts are less than 1 cent to their capital sums', () => {
    const [first, second] = calculateClampedTransferAmountsAndPrices(
      { totalPrice: 6000 },
      [
        {
          type: 'CAPITAL_PAYMENT',
          contributions: 1000.4596,
          profit: 0,
          value: 1000.4596,
          currency: 'EUR',
          unitPrice: 0,
          unitCount: 0,
        },
        {
          type: 'WORK_COMPENSATION',
          contributions: 2000.4412,
          profit: 0,
          value: 2000.4412,
          unitCount: 0,
          unitPrice: 0,
          currency: 'EUR',
        },
      ],
      [
        { type: 'CAPITAL_PAYMENT', bookValue: 1000.450002 },
        { type: 'WORK_COMPENSATION', bookValue: 2000.443 },
      ],
    );

    expect(first).toStrictEqual({
      type: 'CAPITAL_PAYMENT',
      bookValue: 1000.4596,
      price: 2000.3,
    });

    expect(second).toStrictEqual({
      type: 'WORK_COMPENSATION',
      bookValue: 2000.4412,
      price: 3999.69,
    });
  });
});

describe('filterZeroBookValues', () => {
  it('should filter out zero book values', () => {
    expect(
      filterZeroBookValueAmounts([
        { type: 'CAPITAL_PAYMENT', bookValue: 2000, price: 2000 },
        { type: 'WORK_COMPENSATION', bookValue: 1000, price: 1000 },
        { type: 'MEMBERSHIP_BONUS', bookValue: 0, price: 0 },
      ]),
    ).toStrictEqual([
      { type: 'CAPITAL_PAYMENT', bookValue: 2000, price: 2000 },
      { type: 'WORK_COMPENSATION', bookValue: 1000, price: 1000 },
    ]);
  });
});

describe('floorValuesToSecondDecimal', () => {
  it('should floor book values', () => {
    expect(
      floorValuesToSecondDecimal([{ type: 'CAPITAL_PAYMENT', bookValue: 1 / 3, price: 2000 }]),
    ).toStrictEqual([{ type: 'CAPITAL_PAYMENT', bookValue: 0.33, price: 2000 }]);

    expect(
      floorValuesToSecondDecimal([{ type: 'CAPITAL_PAYMENT', bookValue: 0.337, price: 2000 }]),
    ).toStrictEqual([{ type: 'CAPITAL_PAYMENT', bookValue: 0.33, price: 2000 }]);

    expect(
      floorValuesToSecondDecimal([{ type: 'CAPITAL_PAYMENT', bookValue: 0.33493, price: 2000 }]),
    ).toStrictEqual([{ type: 'CAPITAL_PAYMENT', bookValue: 0.33, price: 2000 }]);
  });
});
