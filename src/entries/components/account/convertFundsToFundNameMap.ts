export default function convertFundsToFundNameMap(
  funds: Record<string, string>[],
): Record<string, string> {
  return (funds || []).reduce(
    (map, { name, isin }) => ({
      ...map,
      [isin]: name,
    }),
    {},
  );
}
