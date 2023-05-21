export function isValidPersonalCode(personalCode: string): boolean {
  const code = String(personalCode).split('').map(Number);

  if (code.length !== 11) {
    return false;
  }

  const getCentury = (n: number) => [null, '18', '18', '19', '19', '20', '20'][n];
  const century = getCentury(code[0]);
  if (!century) {
    return false;
  }

  const year = `${code[1]}${code[2]}`;
  const month = `${code[3]}${code[4]}`;
  const day = `${code[5]}${code[6]}`;
  const date = `${century}${year}-${month}-${day}`;

  if (!Date.parse(date)) {
    return false;
  }

  const checksum = code[10];

  const modulus = (pCode: number[], weights: number[]) =>
    pCode.slice(0, 10).reduce((sum, n, i) => {
      return n * weights[i] + sum;
    }, 0) % 11;

  const realChecksum = [
    modulus(code, [1, 2, 3, 4, 5, 6, 7, 8, 9, 1]),
    modulus(code, [3, 4, 5, 6, 7, 8, 9, 1, 2, 3]),
    0,
  ].find((mod) => mod !== 10);

  return checksum === realChecksum;
}
