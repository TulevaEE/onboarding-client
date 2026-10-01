const NAV_SCALE_BY_ISIN: Record<string, number> = {
  EE3600109435: 5, // TUK75
  EE3600109443: 5, // TUK00
  EE3600001707: 4, // TUV100
  EE0000003283: 4, // TKF100
};

const MIN_NAV_SCALE = 5;

function decimalPlaces(n: number): number {
  const str = String(n);
  const dotIndex = str.indexOf('.');
  return dotIndex === -1 ? 0 : str.length - dotIndex - 1;
}

export function navScaleFor(isin: string, nav: number): number {
  const known = NAV_SCALE_BY_ISIN[isin];
  if (known !== undefined) {
    return known;
  }
  return Math.max(MIN_NAV_SCALE, decimalPlaces(nav));
}

export function formatUnits(units: number): string {
  const thousandths = Math.round(Number(Math.abs(units).toFixed(5).replace('.', '')) / 100);
  return `${units < 0 ? '-' : ''}${(thousandths / 1000).toFixed(3)}`;
}
